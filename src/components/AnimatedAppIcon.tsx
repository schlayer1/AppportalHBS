import React from 'react';
import { 
  Languages, 
  Headphones, 
  Coffee, 
  CalendarDays, 
  Briefcase, 
  Compass, 
  HeartHandshake,
  Layers,
  BarChart2
} from 'lucide-react';

interface AnimatedAppIconProps {
  iconName: string;
  className?: string;
  size?: number;
}

export const AnimatedAppIcon: React.FC<AnimatedAppIconProps> = ({ 
  iconName, 
  className = "w-8 h-8",
  size = 32
}) => {
  if (iconName === 'Coffee') {
    return (
      <div className="relative flex items-center justify-center group/icon">
        {/* Animated Steam lines */}
        <div className="absolute -top-2 flex gap-1 pointer-events-none">
          <span className="w-0.5 h-2 rounded-full bg-amber-500/60 animate-bounce duration-1000" />
          <span className="w-0.5 h-2.5 rounded-full bg-amber-500/70 animate-bounce duration-1000 delay-150" />
          <span className="w-0.5 h-2 rounded-full bg-amber-500/60 animate-bounce duration-1000 delay-300" />
        </div>
        <Coffee className={`${className} transition-transform duration-300 group-hover/icon:scale-105`} size={size} />
      </div>
    );
  }

  if (iconName === 'Compass') {
    return (
      <div className="relative flex items-center justify-center group/icon">
        <Compass className={`${className} transition-transform duration-700 ease-out group-hover/icon:rotate-45 group-hover/icon:scale-105`} size={size} />
      </div>
    );
  }

  if (iconName === 'Languages') {
    return (
      <div className="relative flex items-center justify-center group/icon">
        <Languages className={`${className} transition-all duration-300 group-hover/icon:scale-110`} size={size} />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
      </div>
    );
  }

  if (iconName === 'Headphones') {
    return (
      <div className="relative flex items-center justify-center group/icon">
        <Headphones className={`${className} transition-transform duration-300 group-hover/icon:scale-105`} size={size} />
      </div>
    );
  }

  if (iconName === 'CalendarDays') {
    return (
      <div className="relative flex items-center justify-center group/icon">
        <CalendarDays className={`${className} transition-transform duration-300 group-hover/icon:-rotate-6 group-hover/icon:scale-105`} size={size} />
      </div>
    );
  }

  if (iconName === 'Briefcase') {
    return (
      <div className="relative flex items-center justify-center group/icon">
        <Briefcase className={`${className} transition-transform duration-300 group-hover/icon:scale-105`} size={size} />
      </div>
    );
  }

  if (iconName === 'HeartHandshake') {
    return (
      <div className="relative flex items-center justify-center group/icon">
        <HeartHandshake className={`${className} transition-transform duration-300 group-hover/icon:scale-110`} size={size} />
      </div>
    );
  }

  if (iconName === 'BarChart2') {
    return (
      <div className="relative flex items-center justify-center group/icon">
        <BarChart2 className={`${className} transition-transform duration-300 group-hover/icon:scale-110 text-teal-600`} size={size} />
      </div>
    );
  }

  return <Layers className={className} size={size} />;
};
