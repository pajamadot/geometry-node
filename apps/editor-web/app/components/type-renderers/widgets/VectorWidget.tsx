import React from 'react';
import { TypeRendererProps } from '../types';
import NumericInput from './NumericInput';

interface VectorWidgetProps extends TypeRendererProps {
  components: 2 | 3 | 4;
  min?: number;
  max?: number;
  step?: number;
}

export const VectorWidget: React.FC<VectorWidgetProps> = ({
  value,
  defaultValue,
  onValueChange,
  components,
  min,
  max,
  step = 0.1
}) => {
  const currentValue = value ?? defaultValue ?? { x: 0, y: 0, z: 0, w: 0 };

  const handleComponentChange = (component: string, newValue: number) => {
    const newVector = { ...currentValue, [component]: newValue };
    onValueChange?.(newVector);
  };

  const labels = components === 2 ? ['X', 'Y'] : 
                components === 3 ? ['X', 'Y', 'Z'] : 
                ['X', 'Y', 'Z', 'W'];

  return (
    <div className="flex gap-1">
      {labels.map((label, index) => {
        const component = label.toLowerCase() as 'x' | 'y' | 'z' | 'w';
        const componentValue = currentValue[component] ?? 0;

        return (
          <NumericInput
            key={component}
            value={componentValue}
            onChange={(newValue) => handleComponentChange(component, newValue)}
            min={min}
            max={max}
            step={step}
            axisLabel={label}
            showSlider={false} // Disable slider for vector components to save space
          />
        );
      })}
    </div>
  );
};

export const Vector2Widget: React.FC<Omit<VectorWidgetProps, 'components'>> = (props) => (
  <VectorWidget {...props} components={2} />
);

export const Vector3Widget: React.FC<Omit<VectorWidgetProps, 'components'>> = (props) => (
  <VectorWidget {...props} components={3} />
);

export const Vector4Widget: React.FC<Omit<VectorWidgetProps, 'components'>> = (props) => (
  <VectorWidget {...props} components={4} />
); 