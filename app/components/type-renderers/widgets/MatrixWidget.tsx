import React from 'react';
import { TypeRendererProps } from '../types';
import { NumericInput } from './NumericInput';

interface MatrixWidgetProps extends TypeRendererProps {
  size: 3 | 4;
}

export const MatrixWidget: React.FC<MatrixWidgetProps> = ({
  value,
  defaultValue,
  onValueChange,
  size
}) => {
  const currentValue = value ?? defaultValue ?? Array(size * size).fill(0);

  const handleCellChange = (row: number, col: number, newValue: number) => {
    const newMatrix = [...currentValue];
    newMatrix[row * size + col] = newValue;
    onValueChange?.(newMatrix);
  };

  const renderCell = (row: number, col: number) => {
    const index = row * size + col;
    const cellValue = currentValue[index] ?? 0;

    return (
      <NumericInput
        key={`${row}-${col}`}
        value={cellValue}
        onChange={(newValue) => handleCellChange(row, col, newValue)}
        step={0.1}
        className="w-6 h-6"
      />
    );
  };

  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: size }, (_, row) => (
        <div key={row} className="flex gap-1">
          {Array.from({ length: size }, (_, col) => renderCell(row, col))}
        </div>
      ))}
    </div>
  );
};

export const Matrix3Widget: React.FC<Omit<MatrixWidgetProps, 'size'>> = (props) => (
  <MatrixWidget {...props} size={3} />
);

export const Matrix4Widget: React.FC<Omit<MatrixWidgetProps, 'size'>> = (props) => (
  <MatrixWidget {...props} size={4} />
); 