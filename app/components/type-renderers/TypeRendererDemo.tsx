import React, { useState } from 'react';
import { TypeRenderer, ParameterType } from './index';

interface DemoItemProps {
  type: ParameterType;
  name: string;
  defaultValue?: any;
  options?: string[];
}

const DemoItem: React.FC<DemoItemProps> = ({ type, name, defaultValue, options }) => {
  const [value, setValue] = useState(defaultValue);
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="border border-gray-600 rounded p-4 mb-4">
      <h3 className="text-sm font-semibold text-white mb-2">{name} ({type})</h3>
      
      <div className="space-y-2">
        {/* Input Demo */}
        <div className="bg-gray-800 p-3 rounded">
          <div className="text-xs text-gray-400 mb-2">Input (unwired)</div>
          <TypeRenderer
            id={`${type}-input-unwired`}
            name={name}
            type={type}
            isConnected={false}
            isInput={true}
            value={value}
            defaultValue={defaultValue}
            onValueChange={setValue}
            options={options}
          />
        </div>

        <div className="bg-gray-800 p-3 rounded">
          <div className="text-xs text-gray-400 mb-2">Input (wired)</div>
          <TypeRenderer
            id={`${type}-input-wired`}
            name={name}
            type={type}
            isConnected={true}
            isInput={true}
            value={value}
            defaultValue={defaultValue}
            onValueChange={setValue}
            options={options}
          />
        </div>

        <div className="bg-gray-800 p-3 rounded">
          <div className="text-xs text-gray-400 mb-2">Output</div>
          <TypeRenderer
            id={`${type}-output`}
            name={name}
            type={type}
            isConnected={false}
            isInput={false}
            value={value}
            defaultValue={defaultValue}
            onValueChange={setValue}
            options={options}
          />
        </div>
      </div>

      <button
        onClick={() => setIsConnected(!isConnected)}
        className="mt-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Toggle Connection
      </button>
    </div>
  );
};

export const TypeRendererDemo: React.FC = () => {
  const demoTypes: DemoItemProps[] = [
    { type: 'geometry', name: 'Geometry', defaultValue: null },
    { type: 'number', name: 'Float', defaultValue: 0.5 },
    { type: 'integer', name: 'Integer', defaultValue: 42 },
    { type: 'boolean', name: 'Boolean', defaultValue: true },
    { type: 'vector', name: 'Vector3', defaultValue: { x: 1, y: 2, z: 3 } },
    { type: 'string', name: 'String', defaultValue: 'Hello World' },
    { type: 'color', name: 'Color', defaultValue: '#ff0000' },
    { type: 'time', name: 'Time', defaultValue: 0.0 },
    { type: 'quaternion', name: 'Quaternion', defaultValue: { x: 0, y: 0, z: 0, w: 1 } },
    { type: 'matrix', name: 'Matrix4', defaultValue: Array(16).fill(0) },
    { type: 'select', name: 'Enum', defaultValue: 'Option 1', options: ['Option 1', 'Option 2', 'Option 3'] },
    { type: 'file', name: 'File', defaultValue: '' }
  ];

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-6">Type Renderer Demo</h1>
      <p className="text-gray-400 mb-6">
        This demo shows how each parameter type renders in different states (unwired input, wired input, output).
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoTypes.map((demo) => (
          <DemoItem key={demo.type} {...demo} />
        ))}
      </div>
    </div>
  );
}; 