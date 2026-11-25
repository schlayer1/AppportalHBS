import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FixtureItem,
  PlanRoleType,
  RelationKind,
  RoomLayout,
  RoomTemplate,
  SeatPlan,
  SharedSeatingPlan,
  SitzplanClass,
  SitzplanWorkspaceData,
  StudentProfile,
  TableItem,
} from '../../types/sitzplanTypes';
import {
  createDemoClass,
  genId,
  getNextZIndex,
  sanitizeClassPlans,
} from './sitzplanEngine';
import {
  fetchAllSharedPlansFromR2,
  fetchTeacherWorkspaceFromR2,
  getTeacherWorkspaceR2Key,
  loadLocalTeacherWorkspace,
  publishSharedPlanToR2,
  saveLocalTeacherWorkspace,
  syncTeacherWorkspaceToR2,
  unpublishSharedPlanFromR2,
} from '../../services/sitzplanR2Service';

export type SyncState = 'loading' | 'synced' | 'syncing' | 'local-only' | 'error';

function normalizeLoadedClass(c: SitzplanClass): SitzplanClass {
  const sanitized = sanitizeClassPlans(c);
  if (
    sanitized.isDemo ||
    (sanitized.id === 'c1' &&
      (sanitized.name === 'Klasse 4b' ||
        sanitized.name === 'Beispielklasse 4b' ||
        sanitized.name === 'Klasse 4b (Beispiel)'))
  ) {
    return {
      ...sanitized,
      isDemo: true,
      name:
        sanitized.name === 'Klasse 4b' ||
        sanitized.name === 'Beispielklasse 4b' ||
        sanitized.name === 'Klasse 4b (Beispiel)'
          ? 'Klasse 4b (Musterklasse)'
          : sanitized.name,
      classLabel:
        !sanitized.classLabel || sanitized.classLabel === 'Klasse 4b'
          ? 'Klasse 4b (Musterklasse)'
          : sanitized.classLabel,
    };
  }
  return sanitized;
}

export function useSitzplanStore(authorId: string, authorName: string) {
  const [hydrated, setHydrated] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('loading');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const r2WorkspaceKey = getTeacherWorkspaceR2Key(authorId);

  const [classes, setClasses] = useState<SitzplanClass[]>(() => [
    createDemoClass(authorId, authorName, false, 'c1', 'Klasse 4b (Musterklasse)', true),
  ]);
  const [activeClassId, setActiveClassId] = useState<string>('c1');
  const [expert, setExpert] = useState<boolean>(false);
  const [roomTemplates, setRoomTemplates] = useState<RoomTemplate[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number>(() => Date.now());

  // Shared plans directory (across all colleagues, stored in R2)
  const [sharedPlans, setSharedPlans] = useState<SharedSeatingPlan[]>([]);
  const [sharedLoading, setSharedLoading] = useState<boolean>(false);
  const [sharedError, setSharedError] = useState<string | null>(null);

  const skipNextSyncRef = useRef(true);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load: local IndexedDB first, then merge/reconcile with real R2 cloud state
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = await loadLocalTeacherWorkspace(authorId);
      const normalizedLocalClasses =
        local && local.classes.length > 0 ? local.classes.map(normalizeLoadedClass) : null;
      if (!cancelled && normalizedLocalClasses) {
        skipNextSyncRef.current = true;
        setClasses(normalizedLocalClasses);
        setActiveClassId(local!.activeClassId || normalizedLocalClasses[0].id);
        setExpert(Boolean(local!.expert));
        setRoomTemplates(Array.isArray(local!.roomTemplates) ? local!.roomTemplates : []);
        setUpdatedAt(local!.updatedAt || Date.now());
      }
      if (!cancelled) setHydrated(true);

      const remote = await fetchTeacherWorkspaceFromR2(authorId);
      if (cancelled) return;
      if (remote && remote.classes.length > 0) {
        const localTime = local?.updatedAt || 0;
        const remoteTime = remote.updatedAt || 0;
        if (remoteTime >= localTime) {
          const sanitized = remote.classes.map(normalizeLoadedClass);
          if (remoteTime > localTime) {
            skipNextSyncRef.current = true;
            setClasses(sanitized);
            setActiveClassId(remote.activeClassId || sanitized[0].id);
            setExpert(Boolean(remote.expert));
            setRoomTemplates(Array.isArray(remote.roomTemplates) ? remote.roomTemplates : []);
            setUpdatedAt(remoteTime);
            await saveLocalTeacherWorkspace(authorId, { ...remote, classes: sanitized });
          }
          setSyncState('synced');
          setSyncError(null);
          setLastSyncedAt(Date.now());
        } else if (local && normalizedLocalClasses) {
          // Local copy is newer than R2 -> upload to R2 before claiming synced
          setSyncState('syncing');
          const res = await syncTeacherWorkspaceToR2(authorId, {
            ...local,
            classes: normalizedLocalClasses,
          });
          if (!cancelled) {
            setSyncState(res.ok ? 'synced' : 'local-only');
            setSyncError(res.ok ? null : res.error || null);
            if (res.ok) setLastSyncedAt(Date.now());
          }
        }
      } else if (local && normalizedLocalClasses) {
        // Push existing local data to R2 if R2 doesn't have it yet
        setSyncState('syncing');
        const res = await syncTeacherWorkspaceToR2(authorId, {
          ...local,
          classes: normalizedLocalClasses,
        });
        if (!cancelled) {
          setSyncState(res.ok ? 'synced' : 'local-only');
          setSyncError(res.ok ? null : res.error || null);
          if (res.ok) setLastSyncedAt(Date.now());
        }
      } else {
        setSyncState('local-only');
        setSyncError('Noch nicht in R2 gespeichert (erste Änderung oder Klick auf Status lädt hoch).');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authorId]);

  // Persist to IndexedDB + debounced sync to Cloudflare R2
  useEffect(() => {
    if (!hydrated) return;
    const payload: SitzplanWorkspaceData = {
      version: 1,
      authorId,
      authorName,
      classes,
      activeClassId,
      expert,
      roomTemplates,
      updatedAt,
    };
    saveLocalTeacherWorkspace(authorId, payload);

    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    setSyncState('syncing');
    syncTimerRef.current = setTimeout(async () => {
      const res = await syncTeacherWorkspaceToR2(authorId, payload);
      setSyncState(res.ok ? 'synced' : 'local-only');
      setSyncError(res.ok ? null : res.error || null);
      if (res.ok) setLastSyncedAt(Date.now());
    }, 1200);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [hydrated, authorId, authorName, classes, activeClassId, expert, roomTemplates, updatedAt]);

  const touch = useCallback(() => setUpdatedAt(Date.now()), []);

  const refreshSharedPlans = useCallback(async () => {
    setSharedLoading(true);
    setSharedError(null);
    const res = await fetchAllSharedPlansFromR2();
    setSharedPlans(res.plans);
    if (res.error) setSharedError(res.error);
    setSharedLoading(false);
  }, []);

  useEffect(() => {
    if (hydrated) {
      refreshSharedPlans();
    }
  }, [hydrated, refreshSharedPlans]);

  const activeClass =
    classes.find((c) => c.id === activeClassId) ?? classes[0];

  const updateActiveClass = useCallback(
    (updater: (cls: SitzplanClass) => SitzplanClass, sanitize = false) => {
      setClasses((prev) =>
        prev.map((c) => {
          if (c.id !== activeClassId) return c;
          const next = updater(c);
          const stamped = { ...next, updatedAt: Date.now() };
          return sanitize ? sanitizeClassPlans(stamped) : stamped;
        })
      );
      touch();
    },
    [activeClassId, touch]
  );

  const addClass = useCallback(
    (opts: {
      name: string;
      classLabel?: string;
      roleType?: PlanRoleType;
      subject?: string;
      roomLabel?: string;
    }) => {
      const id = genId('c');
      const next: SitzplanClass = {
        id,
        name: opts.name,
        classLabel: opts.classLabel || opts.name,
        roleType: opts.roleType || 'klassenleitung',
        subject: opts.subject || 'Klassenraum',
        roomLabel: opts.roomLabel,
        authorId,
        authorName,
        updatedAt: Date.now(),
        room: {
          w: 1000,
          h: 700,
          tables: [],
          fixtures: [
            { id: genId('f'), kind: 'board', x: 500, y: 22, w: 360, h: 18, rot: 0 },
          ],
        },
        students: [],
        relations: [],
        plans: [],
        activePlanId: null,
      };
      setClasses((prev) => [...prev, next]);
      setActiveClassId(id);
      touch();
      return id;
    },
    [authorId, authorName, touch]
  );

  const renameClass = useCallback(
    (name: string, meta?: Partial<Pick<SitzplanClass, 'classLabel' | 'roleType' | 'subject' | 'roomLabel'>>) => {
      updateActiveClass((c) => ({ ...c, name, ...meta }));
    },
    [updateActiveClass]
  );

  const deleteClass = useCallback(() => {
    setClasses((prev) => {
      const remaining = prev.filter((c) => c.id !== activeClassId);
      const next = remaining.length
        ? remaining
        : [
            {
              ...createDemoClass(authorId, authorName, false, genId('c'), 'Neue Klasse', false),
              students: [],
              relations: [],
              plans: [],
              activePlanId: null,
            },
          ];
      setActiveClassId(next[0].id);
      return next;
    });
    touch();
  }, [activeClassId, authorId, authorName, touch]);

  const addDemoClass = useCallback(() => {
    const id = genId('c');
    const demo = createDemoClass(authorId, authorName, true, id, 'Klasse 4b (Musterklasse)', true);
    setClasses((prev) => [...prev, demo]);
    setActiveClassId(id);
    touch();
  }, [authorId, authorName, touch]);

  const importAll = useCallback(
    (importedClasses: SitzplanClass[], importedTemplates?: RoomTemplate[]) => {
      const normalized = importedClasses.map((c) =>
        sanitizeClassPlans({
          ...c,
          authorId: c.authorId || authorId,
          authorName: c.authorName || authorName,
        })
      );
      setClasses(normalized);
      if (normalized[0]) setActiveClassId(normalized[0].id);
      if (importedTemplates) setRoomTemplates(importedTemplates);
      touch();
    },
    [authorId, authorName, touch]
  );

  const updateRoom = useCallback(
    (fn: (room: RoomLayout) => RoomLayout) => {
      updateActiveClass((c) => ({ ...c, room: fn(c.room) }), true);
    },
    [updateActiveClass]
  );

  const upsertTable = useCallback(
    (table: TableItem) => {
      updateActiveClass((c) => {
        const exists = c.room.tables.some((t) => t.id === table.id);
        return {
          ...c,
          room: {
            ...c.room,
            tables: exists
              ? c.room.tables.map((t) => (t.id === table.id ? table : t))
              : [...c.room.tables, { ...table, z: getNextZIndex(c.room) }],
          },
        };
      }, true);
    },
    [updateActiveClass]
  );

  const removeTable = useCallback(
    (id: string) => {
      updateActiveClass(
        (c) => ({
          ...c,
          room: { ...c.room, tables: c.room.tables.filter((t) => t.id !== id) },
        }),
        true
      );
    },
    [updateActiveClass]
  );

  const upsertFixture = useCallback(
    (fixture: FixtureItem) => {
      updateActiveClass((c) => {
        const exists = c.room.fixtures.some((f) => f.id === fixture.id);
        return {
          ...c,
          room: {
            ...c.room,
            fixtures: exists
              ? c.room.fixtures.map((f) => (f.id === fixture.id ? fixture : f))
              : [...c.room.fixtures, { ...fixture, z: getNextZIndex(c.room) }],
          },
        };
      });
    },
    [updateActiveClass]
  );

  const removeFixture = useCallback(
    (id: string) => {
      updateActiveClass((c) => ({
        ...c,
        room: { ...c.room, fixtures: c.room.fixtures.filter((f) => f.id !== id) },
      }));
    },
    [updateActiveClass]
  );

  const upsertStudent = useCallback(
    (student: StudentProfile) => {
      updateActiveClass((c) => {
        const exists = c.students.some((s) => s.id === student.id);
        return {
          ...c,
          students: exists
            ? c.students.map((s) => (s.id === student.id ? student : s))
            : [...c.students, student],
        };
      });
    },
    [updateActiveClass]
  );

  const addStudentsBulk = useCallback(
    (newStudents: StudentProfile[]) => {
      updateActiveClass((c) => ({
        ...c,
        students: [...c.students, ...newStudents],
      }));
    },
    [updateActiveClass]
  );

  const removeStudent = useCallback(
    (studentId: string) => {
      updateActiveClass((c) => ({
        ...c,
        students: c.students.filter((s) => s.id !== studentId),
        relations: c.relations.filter((r) => r.a !== studentId && r.b !== studentId),
        plans: c.plans.map((p) => {
          const freedSeats = Object.entries(p.assignment)
            .filter(([, sId]) => sId === studentId)
            .map(([seatId]) => seatId);
          return {
            ...p,
            assignment: Object.fromEntries(
              Object.entries(p.assignment).filter(([, sId]) => sId !== studentId)
            ),
            locked: p.locked.filter((s) => !freedSeats.includes(s)),
          };
        }),
      }));
    },
    [updateActiveClass]
  );

  const restoreClassSnapshot = useCallback(
    (snapshot: SitzplanClass) => {
      setClasses((prev) =>
        prev.map((c) => (c.id === snapshot.id ? snapshot : c))
      );
      touch();
    },
    [touch]
  );

  const setRelation = useCallback(
    (a: string, b: string, kind: RelationKind | null) => {
      updateActiveClass((c) => {
        const filtered = c.relations.filter(
          (r) => !((r.a === a && r.b === b) || (r.a === b && r.b === a))
        );
        return {
          ...c,
          relations: kind ? [...filtered, { a, b, kind }] : filtered,
        };
      });
    },
    [updateActiveClass]
  );

  const upsertPlan = useCallback(
    (plan: SeatPlan) => {
      updateActiveClass((c) => {
        const exists = c.plans.some((p) => p.id === plan.id);
        return {
          ...c,
          plans: exists
            ? c.plans.map((p) => (p.id === plan.id ? plan : p))
            : [...c.plans, plan],
          activePlanId: plan.id,
        };
      });
    },
    [updateActiveClass]
  );

  const removePlan = useCallback(
    (planId: string) => {
      updateActiveClass((c) => {
        const remaining = c.plans
          .filter((p) => p.id !== planId)
          .map((p) => (p.basePlanId === planId ? { ...p, basePlanId: undefined } : p));
        return {
          ...c,
          plans: remaining,
          activePlanId: remaining[0]?.id ?? null,
        };
      });
    },
    [updateActiveClass]
  );

  const setActivePlan = useCallback(
    (planId: string) => {
      updateActiveClass((c) => ({ ...c, activePlanId: planId }));
    },
    [updateActiveClass]
  );

  const saveRoomTemplate = useCallback(
    (name: string, room: RoomLayout) => {
      setRoomTemplates((prev) => [
        ...prev,
        { id: genId('rt'), name, room: structuredClone(room) },
      ]);
      touch();
    },
    [touch]
  );

  const removeRoomTemplate = useCallback(
    (id: string) => {
      setRoomTemplates((prev) => prev.filter((t) => t.id !== id));
      touch();
    },
    [touch]
  );

  const publishPlanForColleagues = useCallback(
    async (opts: {
      plan: SeatPlan;
      classLabel: string;
      roleType: PlanRoleType;
      subject: string;
      roomLabel?: string;
      notes?: string;
    }) => {
      const sharedId = `${authorId}__${activeClass.id}`;
      const payload: SharedSeatingPlan = {
        id: sharedId,
        classId: activeClass.id,
        planId: opts.plan.id,
        planName: opts.plan.name,
        classLabel: opts.classLabel.trim() || activeClass.name,
        roleType: opts.roleType,
        subject: opts.subject.trim() || 'Klassenraum',
        roomLabel: opts.roomLabel?.trim() || undefined,
        authorId,
        authorName,
        notes: opts.notes?.trim() || undefined,
        room: structuredClone(activeClass.room),
        assignment: { ...opts.plan.assignment },
        students: activeClass.students.map((s) => ({ id: s.id, name: s.name })),
        updatedAt: Date.now(),
      };
      const res = await publishSharedPlanToR2(payload);
      if (res.ok) {
        updateActiveClass((c) => ({
          ...c,
          classLabel: payload.classLabel,
          roleType: payload.roleType,
          subject: payload.subject,
          roomLabel: payload.roomLabel,
          sharedPlanId: opts.plan.id,
          sharedUpdatedAt: payload.updatedAt,
        }));
        await refreshSharedPlans();
      }
      return res;
    },
    [activeClass, authorId, authorName, refreshSharedPlans, updateActiveClass]
  );

  const unpublishActivePlan = useCallback(async () => {
    const sharedId = `${authorId}__${activeClass.id}`;
    await unpublishSharedPlanFromR2(sharedId);
    updateActiveClass((c) => ({
      ...c,
      sharedPlanId: null,
      sharedUpdatedAt: undefined,
    }));
    await refreshSharedPlans();
  }, [activeClass.id, authorId, refreshSharedPlans, updateActiveClass]);

  const copySharedPlanToMyClasses = useCallback(
    (shared: SharedSeatingPlan, asSubject?: string) => {
      const id = genId('c');
      const subjectLabel = asSubject || shared.subject;
      const newClass: SitzplanClass = {
        id,
        name:
          subjectLabel && subjectLabel !== 'Klassenraum'
            ? `${shared.classLabel} (${subjectLabel})`
            : `${shared.classLabel} (Kopie)`,
        classLabel: shared.classLabel,
        roleType: asSubject ? 'fachlehrer' : 'klassenleitung',
        subject: subjectLabel,
        roomLabel: shared.roomLabel,
        authorId,
        authorName,
        updatedAt: Date.now(),
        room: structuredClone(shared.room),
        students: shared.students.map((s) => ({
          id: s.id,
          name: s.name,
          concentration: 3,
          teamwork: 3,
          talkative: 3,
          support: false,
          front: false,
          solo: false,
        })),
        relations: [],
        plans: [
          {
            id: genId('p'),
            name: 'Variante A',
            seed: 1,
            assignment: { ...shared.assignment },
            locked: [],
            createdAt: Date.now(),
          },
        ],
        activePlanId: null,
      };
      newClass.activePlanId = newClass.plans[0].id;
      setClasses((prev) => [...prev, newClass]);
      setActiveClassId(id);
      touch();
      return id;
    },
    [authorId, authorName, touch]
  );

  const forceSyncNow = useCallback(async () => {
    setSyncState('syncing');
    const payload: SitzplanWorkspaceData = {
      version: 1,
      authorId,
      authorName,
      classes,
      activeClassId,
      expert,
      roomTemplates,
      updatedAt: Date.now(),
    };
    const res = await syncTeacherWorkspaceToR2(authorId, payload);
    setSyncState(res.ok ? 'synced' : 'local-only');
    setSyncError(res.ok ? null : res.error || null);
    if (res.ok) setLastSyncedAt(Date.now());
    return res;
  }, [authorId, authorName, classes, activeClassId, expert, roomTemplates]);

  return {
    hydrated,
    syncState,
    syncError,
    lastSyncedAt,
    r2WorkspaceKey,
    classes,
    activeClass,
    activeClassId,
    expert,
    roomTemplates,
    sharedPlans,
    sharedLoading,
    sharedError,
    setExpert: (val: boolean) => {
      setExpert(val);
      touch();
    },
    setActiveClass: (id: string) => {
      setActiveClassId(id);
      touch();
    },
    addClass,
    renameClass,
    deleteClass,
    addDemoClass,
    importAll,
    updateRoom,
    upsertTable,
    removeTable,
    upsertFixture,
    removeFixture,
    upsertStudent,
    addStudentsBulk,
    removeStudent,
    restoreClassSnapshot,
    setRelation,
    upsertPlan,
    removePlan,
    setActivePlan,
    saveRoomTemplate,
    removeRoomTemplate,
    publishPlanForColleagues,
    unpublishActivePlan,
    refreshSharedPlans,
    copySharedPlanToMyClasses,
    forceSyncNow,
  };
}
