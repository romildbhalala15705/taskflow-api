import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  }
})

// Expose direct db calls
contextBridge.exposeInMainWorld('db', {
  checkDb: () => ipcRenderer.invoke('db:check'),
  loadTasks: () => ipcRenderer.invoke('db:loadTasks'),
  addTask: (data: any) => ipcRenderer.invoke('db:addTask', data),
  updateTask: (id: string, updates: any) => ipcRenderer.invoke('db:updateTask', { id, updates }),
  deleteTask: (id: string) => ipcRenderer.invoke('db:deleteTask', id),
  updateMultiple: (updates: any) => ipcRenderer.invoke('db:updateMultiple', updates)
})
