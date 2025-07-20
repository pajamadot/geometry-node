// Utility function for Alt+click disconnection on output handles
export const createOutputHandleClickHandler = (nodeId: string, handleId: string) => {
  return (event: React.MouseEvent) => {
    if (event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      
      // Dispatch custom event to remove connections from this handle
      const removeConnectionEvent = new CustomEvent('removeHandleConnection', {
        detail: { nodeId, handleId, handleType: 'source' }
      });
      window.dispatchEvent(removeConnectionEvent);
    }
  };
}; 