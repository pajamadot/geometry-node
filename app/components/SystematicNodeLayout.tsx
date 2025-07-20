'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { NodeDefinition, LayoutRow, InputComponent, ParameterType, SOCKET_METADATA, CATEGORY_METADATA, RowType, generateSmartLayout } from '../types/nodeSystem';
import { createOutputHandleClickHandler } from '../utils/handleUtils';
import { TypeRenderer } from './type-renderers';
import ParameterInput from './ParameterInput';

interface SystematicNodeLayoutProps {
  id: string;
  definition: NodeDefinition;
  parameters: Record<string, any>;
  inputConnections: Record<string, boolean>;
  liveParameterValues: Record<string, any>;
  socketValues?: Record<string, any>;
  selected?: boolean;
  disabled?: boolean;
  onParameterChange: (parameterId: string, value: any) => void;
  onSocketValueChange?: (socketId: string, value: any) => void;
}







// Main systematic node layout component
export default function SystematicNodeLayout({
  id,
  definition,
  parameters,
  inputConnections,
  liveParameterValues,
  socketValues = {},
  selected,
  disabled,
  onParameterChange,
  onSocketValueChange
}: SystematicNodeLayoutProps) {
  const categoryMeta = CATEGORY_METADATA[definition.category];
  
  // Auto-generate layout if not provided
  const effectiveLayout = definition.layout || generateSmartLayout(definition.inputs, definition.outputs, definition.parameters);
  
  // Get dynamic instruction based on node type and parameters
  const getDynamicInstruction = (): string => {
    if (definition.type === 'math') {
      const operation = parameters.operation || 'add';
      const formulas: Record<string, string> = {
        add: 'X + Y',
        subtract: 'X - Y',
        multiply: 'X × Y',
        divide: 'X ÷ Y',
        power: 'X ^ Y',
        sin: 'sin(X)',
        cos: 'cos(X)',
        sqrt: '√X',
        abs: '|X|'
      };
      return formulas[operation] || 'X + Y';
    }
    
    // For other nodes, use the layout instruction if available
    const instructionRow = effectiveLayout.find(row => row.type === 'instruction');
    return instructionRow?.instruction || '';
  };
  
  // Blender-style node dimension calculation
  const calculateNodeDimensions = () => {
    // Constants (Blender-like)
    const TITLE_HEIGHT = 32;
    const INSTRUCTION_HEIGHT = 24;
    const ROW_PADDING = 8;
    const COMPONENT_HEIGHT = 28;
    const MIN_COMPONENT_WIDTH = 120;
    const MAX_COMPONENT_WIDTH = 200;
    const SIDE_PADDING = 12;
    const MIN_NODE_WIDTH = 200; // Increased minimum
    const MAX_NODE_WIDTH = 500; // Increased maximum
    const MIN_NODE_HEIGHT = 64;
    const MAX_NODE_HEIGHT = 600;
    
    // Calculate height
    let totalHeight = TITLE_HEIGHT + ROW_PADDING;
    
    // Add instruction row if present
    if (effectiveLayout.some(row => row.type === 'instruction')) {
      totalHeight += INSTRUCTION_HEIGHT + ROW_PADDING;
    }
    
    // Calculate height for all rows
    effectiveLayout.forEach(row => {
      switch (row.type) {
        case 'outputs':
        case 'inputs':
          const componentCount = row.components?.length || 0;
          if (componentCount > 0) {
            // Blender-style: stack components vertically with proper spacing
            const rowHeight = Math.max(COMPONENT_HEIGHT, componentCount * COMPONENT_HEIGHT + ROW_PADDING);
            totalHeight += rowHeight + ROW_PADDING;
          }
          break;
        case 'parameters':
          const paramCount = row.components?.length || 0;
          if (paramCount > 0) {
            // Parameters get more space per component
            const rowHeight = Math.max(COMPONENT_HEIGHT, paramCount * (COMPONENT_HEIGHT + 4) + ROW_PADDING);
            totalHeight += rowHeight + ROW_PADDING;
          }
          break;
      }
    });
    
    // Calculate width based on content analysis
    let maxContentWidth = MIN_NODE_WIDTH;
    
    // Title width - more generous calculation
    const titleWidth = definition.name.length * 8 + 80; // Increased per character and padding
    maxContentWidth = Math.max(maxContentWidth, titleWidth);
    
    // Instruction width - more generous
    const instruction = getDynamicInstruction();
    if (instruction) {
      const instructionWidth = instruction.length * 7 + 60; // Increased per character
      maxContentWidth = Math.max(maxContentWidth, instructionWidth);
    }
    
    // Analyze all components for width requirements
    const allComponents = [
      ...(definition.inputs || []),
      ...(definition.outputs || []),
      ...(definition.parameters || [])
    ];
    
    allComponents.forEach(component => {
      let componentWidth = MIN_COMPONENT_WIDTH;
      
      // Label width - more generous
      const labelWidth = component.name.length * 7 + 40; // Increased per character and padding
      componentWidth = Math.max(componentWidth, labelWidth);
      
      // Input width based on type - much more generous
      switch (component.type) {
        case 'vector':
        case 'transform':
          componentWidth = Math.max(componentWidth, 360); // 3 numeric inputs + labels + spacing
          break;
        case 'matrix':
          componentWidth = Math.max(componentWidth, 280); // Matrix grid with proper spacing
          break;
        case 'color':
          componentWidth = Math.max(componentWidth, 200); // Color picker + text input
          break;
        case 'select':
        case 'enum':
          componentWidth = Math.max(componentWidth, 180); // Dropdown with proper width
          break;
        case 'boolean':
          componentWidth = Math.max(componentWidth, 140); // Checkbox + label
          break;
        case 'string':
          componentWidth = Math.max(componentWidth, 200); // Text input with proper width
          break;
        case 'number':
        case 'integer':
        case 'numeric':
          componentWidth = Math.max(componentWidth, 160); // Numeric input + label
          break;
        default:
          componentWidth = Math.max(componentWidth, 160); // Default with more space
      }
      
      maxContentWidth = Math.max(maxContentWidth, componentWidth + SIDE_PADDING * 2);
    });
    
    // Apply Blender-style constraints with more generous limits
    const finalWidth = Math.min(Math.max(maxContentWidth, MIN_NODE_WIDTH), MAX_NODE_WIDTH);
    const finalHeight = Math.min(Math.max(totalHeight + 40, MIN_NODE_HEIGHT), MAX_NODE_HEIGHT); // Added 10px to bottom
    
    return { width: finalWidth, height: finalHeight };
  };
  
  const { width: calculatedWidth, height: calculatedHeight } = calculateNodeDimensions();
  
  // Use calculated dimensions or fall back to UI settings
  const baseWidth = definition.ui?.width || calculatedWidth;
  const baseHeight = definition.ui?.height || calculatedHeight;
  
  // Handle socket value changes
  const handleSocketValueChange = (socketId: string, value: any) => {
    if (onSocketValueChange) {
      onSocketValueChange(socketId, value);
    }
  };

  // Get dynamic inputs based on node type and parameters
  const getDynamicInputs = (): InputComponent[] => {
    if (definition.type === 'math') {
      const operation = parameters.operation || 'add';
      const inputs: InputComponent[] = [];
      
      // Add inputs based on operation
      if (['add', 'subtract', 'multiply', 'divide', 'power'].includes(operation)) {
        inputs.push(
          {
            id: 'valueA',
            name: 'X',
            type: 'numeric',
            defaultValue: 0,
            description: 'First operand'
          },
          {
            id: 'valueB',
            name: 'Y',
            type: 'numeric',
            defaultValue: 0,
            description: 'Second operand'
          }
        );
      } else if (['sin', 'cos', 'sqrt', 'abs'].includes(operation)) {
        inputs.push({
          id: 'valueA',
          name: 'X',
          type: 'numeric',
          defaultValue: 0,
          description: 'Input value'
        });
      }
      
      return inputs;
    }
    
    // For other nodes, get all inputs from the definition
    return definition.inputs.map(input => ({
      id: input.id,
      name: input.name,
      type: input.type,
      defaultValue: input.defaultValue,
      description: input.description,
      required: input.required,
      min: input.min,
      max: input.max,
      step: input.step,
      options: input.options
    }));
  };

  // Render input component using TypeRenderer
  const renderInputComponent = (component: InputComponent) => {
    const isConnected = inputConnections[component.id] || false;
    const liveValue = liveParameterValues[component.id];
    const socketValue = socketValues[component.id];

    return (
      <TypeRenderer
        id={component.id}
        name={component.name}
        type={component.type}
        isConnected={isConnected}
        isInput={true}
        value={socketValue}
        defaultValue={component.defaultValue}
        onValueChange={(value) => handleSocketValueChange(component.id, value)}
        description={component.description}
        required={component.required}
        min={component.min}
        max={component.max}
        step={component.step}
        options={component.options}
      />
    );
  };



  return (
    <div 
      className={`bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-lg backdrop-blur-sm ${
        selected ? 'ring-2 ring-blue-400' : ''
      } ${disabled ? 'opacity-50' : ''}`}
      style={{
        width: `${baseWidth}px`,
        minHeight: `${baseHeight}px`,
        maxWidth: '500px',
        maxHeight: '600px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Render rows based on layout definition */}
      {effectiveLayout.map((row, rowIndex) => {
        switch (row.type) {
          case 'title':
            return (
              <div 
                key={rowIndex}
                className={`bg-gradient-to-r from-${categoryMeta.color}-600 to-${categoryMeta.color}-500 px-3 py-3 rounded-t-lg`}
                style={{
                  background: `linear-gradient(to right, ${definition.color.primary}, ${definition.color.secondary})`,
                  minHeight: row.height || '40px'
                }}
              >
                <h3 
                  className="text-sm font-semibold text-white tracking-wide flex items-center gap-2 cursor-help"
                  title={definition.description}
                >
                  {definition.ui?.icon && (
                    <span className="flex items-center">
                      {typeof definition.ui.icon === 'string' ? (
                        <span>{definition.ui.icon}</span>
                      ) : (
                        <definition.ui.icon size={16} />
                      )}
                    </span>
                  )}
                  {definition.name}
                </h3>
              </div>
            );
            
          case 'instruction':
            return (
              <div 
                key={rowIndex}
                className="px-3 py-2 border-b border-slate-600/30"
                style={{ minHeight: row.height || '32px' }}
              >
                <div className="text-xs text-blue-400 font-mono text-center">
                  {getDynamicInstruction()}
                </div>
              </div>
            );
            
          case 'outputs':
            return (
              <div 
                key={rowIndex}
                className="relative px-3 border-b border-slate-600/30"
                style={{ minHeight: row.height || '32px' }}
              >
                {row.components?.map((component, index) => {
                  const totalOutputs = row.components?.length || 1;
                  const topPercent = totalOutputs === 1 ? 50 : (index / (totalOutputs - 1)) * 80 + 10;
                  
                  return (
                    <div 
                      key={component.id} 
                      style={{ 
                        position: 'absolute', 
                        top: `${topPercent}%`, 
                        transform: 'translateY(-50%)', 
                        right: '0px',
                        width: 'calc(100% - 8px)',
                        zIndex: 10
                      }}
                    >
                      <TypeRenderer
                        id={component.id}
                        name={component.name}
                        type={component.type}
                        isConnected={false}
                        isInput={false}
                        value={undefined}
                        defaultValue={component.defaultValue}
                        description={component.description}
                        required={component.required}
                        min={component.min}
                        max={component.max}
                        step={component.step}
                        options={component.options}
                      />
                    </div>
                  );
                })}
              </div>
            );
            
          case 'inputs':
            return (
              <div 
                key={rowIndex}
                className="relative px-3 border-b border-slate-600/30"
                style={{ minHeight: row.height || 'auto' }}
              >
                {getDynamicInputs().map((component, index) => {
                  const totalInputs = getDynamicInputs().length || 1;
                  const topPercent = totalInputs === 1 ? 50 : (index / (totalInputs - 1)) * 80 + 10;
                  const isConnected = inputConnections[component.id] || false;
                  const liveValue = liveParameterValues[component.id];
                  
                  return (
                    <div 
                      key={`${component.id}-${index}`} 
                      style={{ 
                        position: 'absolute', 
                        top: `${topPercent}%`, 
                        transform: 'translateY(-50%)', 
                        left: '0px',
                        width: 'calc(100% - 8px)',
                        zIndex: 10
                      }}
                    >
                      <TypeRenderer
                        id={component.id}
                        name={component.name}
                        type={component.type}
                        isConnected={isConnected}
                        isInput={true}
                        value={isConnected ? liveValue : (parameters[component.id] || component.defaultValue)}
                        defaultValue={component.defaultValue}
                        onValueChange={(value) => onParameterChange(component.id, value)}
                        description={component.description}
                        required={component.required}
                        min={component.min}
                        max={component.max}
                        step={component.step}
                        options={component.options}
                      />
                    </div>
                  );
                })}
              </div>
            );
            
          case 'parameters':
            return (
              <div 
                key={rowIndex}
                className="relative px-3 border-b border-slate-600/30"
                style={{ minHeight: row.height || 'auto' }}
              >
                {row.components?.map((component, index) => {
                  const totalParams = row.components?.length || 1;
                  const topPercent = totalParams === 1 ? 50 : (index / (totalParams - 1)) * 80 + 10;
                  
                  return (
                    <div 
                      key={`${component.id}-${index}`} 
                      style={{ 
                        position: 'absolute', 
                        top: `${topPercent}%`, 
                        transform: 'translateY(-50%)', 
                        left: '0px',
                        width: 'calc(100% - 8px)',
                        zIndex: 10
                      }}
                    >
                      <TypeRenderer
                        id={component.id}
                        name={component.name}
                        type={component.type}
                        isConnected={false}
                        isInput={true}
                        value={parameters[component.id]}
                        defaultValue={component.defaultValue}
                        onValueChange={(value) => onParameterChange(component.id, value)}
                        description={component.description}
                        required={component.required}
                        min={component.min}
                        max={component.max}
                        step={component.step}
                        options={component.options}
                      />
                    </div>
                  );
                })}
              </div>
            );
            
          default:
            return null;
        }
      })}
    </div>
  );
} 