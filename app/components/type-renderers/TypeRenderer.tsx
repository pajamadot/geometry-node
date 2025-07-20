import React from 'react';
import { ParameterType, TypeRendererProps, TYPE_WIDGET_MAP } from './types';
import { SocketRenderer } from './SocketRenderer';
import { NumericWidget } from './widgets/NumericWidget';
import { StepperWidget } from './widgets/StepperWidget';
import { CheckboxWidget } from './widgets/CheckboxWidget';
import { Vector2Widget, Vector3Widget, Vector4Widget } from './widgets/VectorWidget';
import { ColorWidget } from './widgets/ColorWidget';
import { TextWidget } from './widgets/TextWidget';
import { DropdownWidget } from './widgets/DropdownWidget';
import { RotationWidget } from './widgets/RotationWidget';
import { Matrix3Widget, Matrix4Widget } from './widgets/MatrixWidget';

interface TypeRendererComponentProps extends TypeRendererProps {
  // Additional props for specific widgets
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export const TypeRenderer: React.FC<TypeRendererComponentProps> = (props) => {
  const { type, isInput, ...restProps } = props;
  const widgetType = TYPE_WIDGET_MAP[type];

  // Render widget based on type
  const renderWidget = () => {
    if (!isInput) return null; // No widgets for outputs


    switch (widgetType) {
      case 'numeric':
        return <NumericWidget {...props} />;
      
      case 'stepper':
        return <StepperWidget {...props} />;
      
      case 'checkbox':
        return <CheckboxWidget {...props} />;
      
      case 'vector2':
        return <Vector2Widget {...props} />;
      
      case 'vector3':
        return <Vector3Widget {...props} />;
      
      case 'vector4':
        return <Vector4Widget {...props} />;
      
      case 'rotation':
        return <RotationWidget {...props} />;
      
      case 'quaternion':
        return <Vector4Widget {...props} />; // Quaternion uses Vector4 widget
      
      case 'matrix3':
        return <Matrix3Widget {...props} />;
      
      case 'matrix4':
        return <Matrix4Widget {...props} />;
      
      case 'color':
        return <ColorWidget {...props} />;
      
      case 'text':
        return <TextWidget {...props} />;
      
      case 'dropdown':
        console.log('TypeRenderer: Rendering dropdown widget with props:', props);
        return <DropdownWidget {...props} />;
      
      case 'none':
      default:
        return null; // No widget for geometry and other types
    }
  };

  return (
    <SocketRenderer {...props}>
      {renderWidget()}
    </SocketRenderer>
  );
};

// Convenience components for specific types
export const GeometryRenderer: React.FC<TypeRendererComponentProps> = (props) => (
  <TypeRenderer {...props} type="geometry" />
);

export const VectorRenderer: React.FC<TypeRendererComponentProps> = (props) => (
  <TypeRenderer {...props} type="vector" />
);

export const NumberRenderer: React.FC<TypeRendererComponentProps> = (props) => (
  <TypeRenderer {...props} type="number" />
);

export const IntegerRenderer: React.FC<TypeRendererComponentProps> = (props) => (
  <TypeRenderer {...props} type="integer" />
);

export const BooleanRenderer: React.FC<TypeRendererComponentProps> = (props) => (
  <TypeRenderer {...props} type="boolean" />
);

export const StringRenderer: React.FC<TypeRendererComponentProps> = (props) => (
  <TypeRenderer {...props} type="string" />
);

export const ColorRenderer: React.FC<TypeRendererComponentProps> = (props) => (
  <TypeRenderer {...props} type="color" />
);

export const TimeRenderer: React.FC<TypeRendererComponentProps> = (props) => (
  <TypeRenderer {...props} type="time" />
);

export const QuaternionRenderer: React.FC<TypeRendererComponentProps> = (props) => (
  <TypeRenderer {...props} type="quaternion" />
);

export const MatrixRenderer: React.FC<TypeRendererComponentProps> = (props) => (
  <TypeRenderer {...props} type="matrix" />
);

export const SelectRenderer: React.FC<TypeRendererComponentProps> = (props) => (
  <TypeRenderer {...props} type="select" />
);

export const EnumRenderer: React.FC<TypeRendererComponentProps> = (props) => (
  <TypeRenderer {...props} type="enum" />
); 