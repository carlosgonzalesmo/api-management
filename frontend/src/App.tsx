import React, { useEffect, useState, useRef } from 'react';
import { ENV_ERROR, ENV } from './env';
import { api } from './api/client';
import type {
  Endpoint,
  EndpointParameter,
  Schedule,
  CreateEndpointPayload,
  CreateParameterPayload,
  CreateSchedulePayload,
  Execution,
} from './api/types';

interface LogEntry {
  id: number;
  ts: number;
  msg: string;
}

export default function App() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selected, setSelected] = useState<Endpoint | null>(null);
  const [parameters, setParameters] = useState<EndpointParameter[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [lastExecution, setLastExecution] = useState<Execution | null>(null);
  const [expandedExecs, setExpandedExecs] = useState<Record<string, boolean>>({});
  const [creatingEndpoint, setCreatingEndpoint] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState(false);
  const [editValues, setEditValues] = useState<Partial<Endpoint>>({});
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  // Estado para valores de parámetros dinámicos
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [paramCreating, setParamCreating] = useState(false);
  const [scheduleCreating, setScheduleCreating] = useState(false);
  const [newScheduleType, setNewScheduleType] = useState<'CRON' | 'INTERVAL' | 'ONCE'>('CRON');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const errorTimerRef = useRef<number | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const logCounterRef = useRef(0);

  const pushLog = (msg: string) => {
    const id = ++logCounterRef.current;
    setLog(l => [{ id, ts: Date.now(), msg }, ...l.slice(0, 199)]);
  };

  const showError = (msg: string) => {
    pushLog(`ERROR: ${msg}`);
    setErrorBanner(msg);
    if (errorTimerRef.current) {
      window.clearTimeout(errorTimerRef.current);
    }
    errorTimerRef.current = window.setTimeout(() => {
      setErrorBanner(null);
      errorTimerRef.current = null;
    }, 5000);
  };

  async function refreshEndpoints() {
    setLoading(true);
    try {
      const list = await api.listEndpoints();
      setEndpoints(list);
    } catch (e: any) {
      showError(`listEndpoints: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshEndpoints();
  }, []);

  async function selectEndpoint(ep: Endpoint) {
    setSelected(ep);
    setEditingEndpoint(false);
    setEditValues({});
    setParamValues({}); // Limpiar valores de parámetros al cambiar endpoint
    try {
      const [params, schs] = await Promise.all([
        api.listParameters(ep.id),
        api.listSchedules(ep.id),
      ]);
      setParameters(params);
      setSchedules(schs);
      const execs = await api.listExecutions(ep.id, 20);
      setExecutions(execs);
    } catch (e: any) {
      showError(`cargando detalles: ${e.message}`);
    }
  }

  function startEditEndpoint() {
    if (!selected) return;
    setEditValues({
      name: selected.name,
      method: selected.method,
      baseUrl: selected.baseUrl,
      path: selected.path,
    });
    setEditingEndpoint(true);
  }

  async function handleEditEndpoint(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!selected) return;
    const form = ev.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get('name')),
      method: String(fd.get('method')),
      baseUrl: String(fd.get('baseUrl')),
      path: String(fd.get('path')),
    };
    try {
      const updated = await api.updateEndpoint(selected.id, payload);
      pushLog(`Endpoint actualizado: ${updated.name}`);
      setEditingEndpoint(false);
      setEditValues({});
      await refreshEndpoints();
      // refrescar selección
      const refreshed = await api.getEndpoint(selected.id);
      setSelected(refreshed);
    } catch (e: any) {
      showError(`actualizar endpoint: ${e.message}`);
    }
  }

  async function handleCreateEndpoint(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget; // guardar referencia antes de await
    const fd = new FormData(form);
    const payload: CreateEndpointPayload = {
      name: String(fd.get('name')),
      method: String(fd.get('method')) as any,
      baseUrl: String(fd.get('baseUrl')),
      path: String(fd.get('path')),
    };
    try {
      const created = await api.createEndpoint(payload);
      pushLog(`Endpoint creado: ${created.name}`);
      form.reset();
      setCreatingEndpoint(false);
      await refreshEndpoints();
    } catch (e: any) {
      showError(`crear endpoint: ${e.message}`);
    }
  }

  async function handleCreateParameter(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!selected) return;
    const form = ev.currentTarget;
    const fd = new FormData(form);
    const payload: CreateParameterPayload = {
      location: fd.get('location') as any,
      name: String(fd.get('name')),
      dataType: fd.get('dataType') as any,
      required: fd.get('required') === 'on',
      defaultValue: (fd.get('defaultValue') as string) || null,
    };
    setParamCreating(true);
    try {
      const created = await api.createParameter(selected.id, payload);
      pushLog(`Parámetro creado: ${created.name}`);
      form.reset();
      const params = await api.listParameters(selected.id);
      setParameters(params);
    } catch (e: any) {
      showError(`crear parámetro: ${e.message}`);
    } finally {
      setParamCreating(false);
    }
  }

  async function handleDeleteParameter(id: string) {
    if (!selected) return;
    try {
      await api.deleteParameter(id);
      pushLog(`Parámetro eliminado`);
      setParameters(p => p.filter(x => x.id !== id));
    } catch (e: any) {
      showError(`borrar parámetro: ${e.message}`);
    }
  }

  async function handleCreateSchedule(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!selected) return;
    const form = ev.currentTarget;
    const fd = new FormData(form);
    const type = fd.get('type') as string;
    const payload: CreateSchedulePayload = { type: type as any };
    if (type === 'CRON') {
      payload.cronExpression = String(fd.get('cronExpression'));
    } else if (type === 'INTERVAL') {
      const raw = fd.get('intervalMs');
      if (raw) payload.intervalMs = Number(raw);
    }
    setScheduleCreating(true);
    try {
      const created = await api.createSchedule(selected.id, payload);
      pushLog(`Schedule creado: ${created.id}`);
      form.reset();
      const schs = await api.listSchedules(selected.id);
      setSchedules(schs);
    } catch (e: any) {
      showError(`crear schedule: ${e.message}`);
    } finally {
      setScheduleCreating(false);
    }
  }

  async function handleDeleteSchedule(id: string) {
    if (!selected) return;
    try {
      await api.deleteSchedule(id);
      pushLog(`Schedule eliminado`);
      setSchedules(s => s.filter(x => x.id !== id));
    } catch (e: any) {
      showError(`borrar schedule: ${e.message}`);
    }
  }

  async function handleExecute(ev?: React.FormEvent<HTMLFormElement>) {
    if (ev) ev.preventDefault();
    if (!selected) return;
    setExecuting(true);
    let attempts = 0;
    const maxAttempts = 2; // un retry adicional si timeout
    // Prepara overrides: solo parámetros definidos
    const overrides: Record<string, any> = {};
    for (const p of parameters) {
      if (paramValues[p.name] !== undefined && paramValues[p.name] !== '') {
        // Coerción básica según tipo
        let val: any = paramValues[p.name];
        if (p.dataType === 'number') val = Number(val);
        if (p.dataType === 'boolean') val = val === 'true' || val === '1';
        overrides[p.name] = val;
      }
    }
    let lastExec: Execution | null = null;
    while (attempts < maxAttempts) {
      attempts++;
      try {
        const exec: Execution = await api.executeEndpoint(selected.id, { overrides });
        lastExec = exec;
        const duration = exec.durationMs != null ? ` (${exec.durationMs}ms)` : '';
        pushLog(`Ejecutado status=${exec.status}${duration}${attempts > 1 ? ' (retry)' : ''}`);
        setLastExecution(exec); // guardar ejecución para mostrar detalle
        if (exec.status !== 'TIMEOUT') break; // si TIMEOUT reintenta
        if (attempts < maxAttempts) {
          pushLog('Reintentando por TIMEOUT...');
        }
      } catch (e: any) {
        showError(`ejecutar: ${e.message}`);
        break;
      }
    }
    // Refrescar historial de ejecuciones tras ejecutar
    try {
      if (selected) {
        const execs = await api.listExecutions(selected.id, 20);
        setExecutions(execs);
      }
    } catch (e: any) {
      showError(`refrescar historial: ${e.message}`);
    }
    setExecuting(false);
  }

  if (ENV_ERROR) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
        <h1>Configuración incompleta</h1>
        <p style={{ maxWidth: 600 }}>{ENV_ERROR}</p>
        <ol>
          <li>Crear archivo <code>.env.local</code> en <code>frontend/</code>.</li>
          <li>Añadir líneas:<pre style={{ background:'#f6f8fa', padding:'0.75rem' }}>VITE_API_BASE_URL=http://localhost:3000
VITE_API_KEY=TU_API_KEY</pre></li>
          <li>Reiniciar el servidor de desarrollo: <code>npm run dev</code>.</li>
        </ol>
        <p>Base URL actual usada (fallback): <code>{ENV.VITE_API_BASE_URL}</code></p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>API Management Frontend</h1>
        <button onClick={refreshEndpoints} disabled={loading}>{loading ? 'Cargando...' : 'Refrescar'}</button>
      </header>
      {errorBanner && (
        <div style={{ background: '#ffe0e0', color: '#b30000', padding: '0.5rem', borderRadius: 4, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#b30000', fontWeight: 'bold' }}>×</button>
        </div>
      )}
      {/* Debug Bar para verificar cambios y estado React (se puede ocultar en producción) */}
      <div style={{ fontSize: '0.65rem', background: '#f6f8fa', border: '1px solid #ddd', padding: '0.35rem 0.5rem', borderRadius: 4, display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <span>Endpoints: {endpoints.length}</span>
        <span>Selected: {selected ? selected.id.slice(0, 8) : 'none'}</span>
        <span>Params: {parameters.length}</span>
        <span>Schedules: {schedules.length}</span>
        <span>Exec loading: {executing ? 'yes' : 'no'}</span>
        <span>ParamCreating: {paramCreating ? 'yes' : 'no'}</span>
        <span>ScheduleCreating: {scheduleCreating ? 'yes' : 'no'}</span>
        <span>Log entries: {log.length}</span>
        <span title="Hot Module Replacement timestamp">HMR: {new Date().toLocaleTimeString()}</span>
      </div>
      <main style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1rem', minHeight: '70vh' }}>
        {/* Columna Endpoints */}
        <section style={{ border: '1px solid #ddd', borderRadius: 6, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Endpoints</h2>
          <button onClick={() => setCreatingEndpoint(c => !c)}>{creatingEndpoint ? 'Cancelar' : 'Nuevo Endpoint'}</button>
          {creatingEndpoint && (
            <form onSubmit={handleCreateEndpoint} style={{ display: 'grid', gap: '0.25rem' }}>
              <input name="name" placeholder="Nombre" required />
              <select name="method" defaultValue="GET" required>
                <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
              </select>
              <input name="baseUrl" placeholder="Base URL" required />
              <input name="path" placeholder="Path (/users/{id})" required />
              <button type="submit">Crear</button>
            </form>
          )}
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1, overflow: 'auto' }}>
            {endpoints.map(ep => (
              <li key={ep.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button style={{ textAlign: 'left', flex: 1 }} onClick={() => selectEndpoint(ep)}>
                  {ep.name} [{ep.method}] {ep.baseUrl}{ep.path}
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`¿Eliminar endpoint "${ep.name}"?`)) return;
                    try {
                      await api.deleteEndpoint(ep.id);
                      pushLog(`Endpoint eliminado: ${ep.name}`);
                      // limpiar selección si era el seleccionado
                      setEndpoints(list => list.filter(x => x.id !== ep.id));
                      if (selected?.id === ep.id) {
                        setSelected(null);
                        setParameters([]);
                        setSchedules([]);
                        setExecutions([]);
                        setLastExecution(null);
                      }
                    } catch (e: any) {
                      showError(`eliminar endpoint: ${e.message}`);
                    }
                  }}
                  style={{ background: '#ffe5e5', border: '1px solid #ffcccc', padding: '0.15rem 0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                  title="Eliminar endpoint"
                  aria-label={`Eliminar endpoint ${ep.name}`}
                >
                  <i className="fas fa-trash" aria-hidden="true" style={{ fontSize: '1rem', color: '#b30000' }}></i>
                </button>
              </li>
            ))}
          </ul>
        </section>
        {/* Columna Detalle */}
        <section style={{ border: '1px solid #ddd', borderRadius: 6, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Detalle</h2>
          {!selected && <p>Selecciona un endpoint para ver detalles.</p>}
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                {!editingEndpoint ? (
                  <>
                    <strong>{selected.name}</strong> [{selected.method}] {selected.baseUrl}{selected.path}
                    <button
                      style={{ marginLeft: 8, fontSize: '0.8em', padding: '0.15em 0.6em' }}
                      onClick={startEditEndpoint}
                    >Editar</button>
                  </>
                ) : (
                  <form onSubmit={handleEditEndpoint} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', background: '#f8fafd', border: '1px solid #e0e0e0', borderRadius: 4, padding: '0.5rem', marginBottom: 8 }}>
                    <input
                      name="name"
                      value={editValues.name ?? ''}
                      onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                      placeholder="Nombre"
                      required
                      style={{ minWidth: 100 }}
                    />
                    <select
                      name="method"
                      value={editValues.method ?? 'GET'}
                      onChange={e => setEditValues(v => ({ ...v, method: e.target.value }))}
                      required
                    >
                      <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
                    </select>
                    <input
                      name="baseUrl"
                      value={editValues.baseUrl ?? ''}
                      onChange={e => setEditValues(v => ({ ...v, baseUrl: e.target.value }))}
                      placeholder="Base URL"
                      required
                      style={{ minWidth: 120 }}
                    />
                    <input
                      name="path"
                      value={editValues.path ?? ''}
                      onChange={e => setEditValues(v => ({ ...v, path: e.target.value }))}
                      placeholder="Path"
                      required
                      style={{ minWidth: 120 }}
                    />
                    <button type="submit">Guardar</button>
                    <button type="button" onClick={() => { setEditingEndpoint(false); setEditValues({}); }}>Cancelar</button>
                  </form>
                )}
              </div>
              {/* Formulario dinámico de parámetros para ejecución */}
              <form
                onSubmit={handleExecute}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem', background: '#f8fafd', border: '1px solid #e0e0e0', borderRadius: 4, padding: '0.5rem' }}
                autoComplete="off"
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {parameters.length === 0 && <span style={{ fontSize: '0.8rem', color: '#888' }}>Sin parámetros definidos</span>}
                  {parameters.map(p => (
                    <label key={p.id} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', minWidth: 120 }}>
                      {p.location}.{p.name}
                      <input
                        type={p.dataType === 'number' ? 'number' : 'text'}
                        name={p.name}
                        value={paramValues[p.name] ?? ''}
                        onChange={e => setParamValues(v => ({ ...v, [p.name]: e.target.value }))}
                        placeholder={p.defaultValue ?? (p.location === 'PATH' ? 'Obligatorio' : '')}
                        style={{ fontSize: '0.9em', padding: '0.2em', border: '1px solid #ccc', borderRadius: 3 }}
                        required={p.required || p.location === 'PATH'}
                        autoComplete="off"
                      />
                    </label>
                  ))}
                </div>
                <button type="submit" disabled={executing} style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}>{executing ? 'Ejecutando...' : 'Ejecutar'}</button>
              </form>
              {/* Parámetros */}
              <div>
                <h3 style={{ margin: '0 0 0.5rem' }}>Parámetros</h3>
                <form onSubmit={handleCreateParameter} style={{ display: 'grid', gap: '0.25rem', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <select name="location" required>
                    <option>PATH</option><option>QUERY</option><option>HEADER</option><option>BODY</option>
                  </select>
                  <input name="name" placeholder="name" required />
                  <select name="dataType" required>
                    <option>string</option><option>number</option><option>boolean</option>
                  </select>
                  <input name="defaultValue" placeholder="default" />
                  <label style={{ gridColumn: 'span 4', fontSize: '0.8rem' }}>
                    <input type="checkbox" name="required" /> Requerido
                  </label>
                      <button type="submit" disabled={paramCreating} style={{ gridColumn: 'span 4' }}>{paramCreating ? 'Creando...' : 'Agregar'}</button>
                </form>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {parameters.map(p => (
                    <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>{p.location}.{p.name} ({p.dataType}) {p.required ? 'required' : ''}</span>
                      <button
                        onClick={() => handleDeleteParameter(p.id)}
                        style={{ background: '#ffe5e5', border: '1px solid #ffcccc', padding: '0.15rem 0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                        title={`Eliminar parámetro ${p.name}`}
                        aria-label={`Eliminar parámetro ${p.name}`}
                      >
                        <i className="fas fa-trash" aria-hidden="true" style={{ fontSize: '1rem', color: '#b30000' }}></i>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Schedules */}
              <div>
                <h3 style={{ margin: '0 0 0.5rem' }}>Schedules</h3>
                <form onSubmit={handleCreateSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', background:'#f8fafd', border:'1px solid #e0e0e0', borderRadius:4, padding:'0.5rem' }}>
                  <label style={{ fontSize:'0.75rem', display:'flex', flexDirection:'column', gap:4 }}>
                    Tipo de programación
                    <select
                      name="type"
                      value={newScheduleType}
                      onChange={e => setNewScheduleType(e.target.value as any)}
                      required
                      style={{ padding:'0.25rem' }}
                    >
                      <option value="CRON">CRON (patrón avanzado)</option>
                      <option value="INTERVAL">INTERVAL (cada X ms)</option>
                      <option value="ONCE">ONCE (una sola vez)</option>
                    </select>
                  </label>
                  {newScheduleType === 'CRON' && (
                    <label style={{ fontSize:'0.75rem', display:'flex', flexDirection:'column', gap:4 }}>
                      Expresión CRON (min hora díaMes mes díaSemana)
                      <input
                        name="cronExpression"
                        placeholder="*/5 * * * *"
                        required={newScheduleType === 'CRON'}
                        style={{ padding:'0.25rem', fontSize:'0.8rem' }}
                      />
                      <span style={{ fontSize:'0.65rem', color:'#555' }}>Ejemplos: "*/5 * * * *" (cada 5 min), "0 3 * * *" (diario 03:00)</span>
                    </label>
                  )}
                  {newScheduleType === 'INTERVAL' && (
                    <label style={{ fontSize:'0.75rem', display:'flex', flexDirection:'column', gap:4 }}>
                      Intervalo en milisegundos
                      <input
                        name="intervalMs"
                        type="number"
                        min={1000}
                        placeholder="60000"
                        required={newScheduleType === 'INTERVAL'}
                        style={{ padding:'0.25rem', fontSize:'0.8rem' }}
                      />
                      <span style={{ fontSize:'0.65rem', color:'#555' }}>Ejemplo: 60000 = 1 minuto. Usa valores razonables para no saturar.</span>
                    </label>
                  )}
                  {newScheduleType === 'ONCE' && (
                    <div style={{ fontSize:'0.7rem', color:'#555' }}>Se programará una sola ejecución. (El backend calculará la próxima fecha si se provee lógica adicional).</div>
                  )}
                  <button type="submit" disabled={scheduleCreating} style={{ marginTop:'0.25rem' }}>{scheduleCreating ? 'Creando...' : 'Crear schedule'}</button>
                </form>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {schedules.map(s => (
                    <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>
                        <strong>{s.type}</strong> · Próxima: {new Date(s.nextRunAt).toLocaleString()} {s.enabled ? '' : '(off)'}
                        {s.type === 'CRON' && s.cronExpression && (
                          <span style={{ color:'#666', marginLeft:4 }}>cron: {s.cronExpression}</span>
                        )}
                        {s.type === 'INTERVAL' && s.intervalMs != null && (
                          <span style={{ color:'#666', marginLeft:4 }}>interval: {s.intervalMs} ms</span>
                        )}
                      </span>
                      <button onClick={() => handleDeleteSchedule(s.id)}>X</button>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Executions */}
              <div>
                <h3 style={{ margin: '0 0 0.5rem' }}>Últimas ejecuciones</h3>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selected) return;
                    try {
                      const execs = await api.listExecutions(selected.id, 20);
                      setExecutions(execs);
                      pushLog('Ejecuciones refrescadas');
                    } catch (e: any) {
                      showError(`refrescar ejecuciones: ${e.message}`);
                    }
                  }}
                  style={{ marginBottom: '0.25rem' }}
                >Refrescar ejecuciones</button>
                <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid #eee', borderRadius: 4, padding: '0.25rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                    <thead>
                      <tr style={{ textAlign: 'left' }}>
                        <th>ID</th>
                        <th>Status</th>
                        <th>HTTP</th>
                        <th>Dur(ms)</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {executions.map(ex => (
                        <tr
                          key={ex.id}
                          style={{ borderTop: '1px solid #eee', cursor: 'pointer', background: lastExecution?.id === ex.id ? '#f0f8ff' : undefined }}
                          onClick={() => setLastExecution(ex)}
                          title="Click para ver detalle"
                        >
                          <td title={ex.id}>{ex.id.slice(0, 8)}</td>
                          <td>{ex.status}</td>
                          <td>{ex.httpStatusCode ?? '-'}</td>
                          <td>{ex.durationMs ?? '-'}</td>
                          <td>{new Date(ex.createdAt).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                      {executions.length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '0.5rem' }}>Sin ejecuciones</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Detalle de ejecución seleccionada */}
                <div style={{ marginTop: '0.5rem' }}>
                  <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.8rem' }}>Detalle ejecución seleccionada</h4>
                  {!lastExecution && <p style={{ fontSize: '0.65rem', margin: 0 }}>Selecciona una fila o ejecuta el endpoint.</p>}
                  {lastExecution && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ fontSize: '0.65rem', color: '#555' }}>
                        ID: {lastExecution.id.slice(0, 8)} | Status: {lastExecution.status} | HTTP: {lastExecution.httpStatusCode ?? '-'} | Dur: {lastExecution.durationMs ?? '-'}ms {lastExecution.responseTruncated ? '(TRUNCADO)' : ''}
                      </div>
                      {lastExecution.errorMessage && (
                        <div style={{ fontSize: '0.65rem', color: '#b30000' }}>Error: {lastExecution.errorMessage}</div>
                      )}
                      <details open style={{ fontSize: '0.65rem' }}>
                        <summary style={{ cursor: 'pointer' }}>Response Body</summary>
                        <pre style={{ maxHeight: 180, overflow: 'auto', background: '#1e1e1e', color: '#dcdcdc', padding: '0.5rem', fontSize: '0.6rem', borderRadius: 4 }}>
{JSON.stringify(lastExecution.responseBodyJson, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
                {/* Historial completo de respuestas */}
                <div style={{ marginTop: '0.75rem' }}>
                  <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.8rem' }}>Historial de respuestas (últimas {executions.length})</h4>
                  {executions.length === 0 && <p style={{ fontSize: '0.65rem', margin: 0 }}>Sin ejecuciones aún.</p>}
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: 260, overflow: 'auto' }}>
                    {executions.map(ex => {
                      const expanded = expandedExecs[ex.id] ?? false;
                      return (
                        <li key={ex.id} style={{ border: '1px solid #eee', borderRadius: 4, padding: '0.4rem', background: '#fafafa' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.65rem' }}>
                              <strong>{ex.status}</strong> HTTP {ex.httpStatusCode ?? '-'} Dur {ex.durationMs ?? '-'}ms {ex.responseTruncated && '· TRUNCADO'}<br />
                              <span style={{ color: '#555' }}>{new Date(ex.createdAt).toLocaleString()} · {ex.id.slice(0,8)}</span>
                              {ex.errorMessage && (
                                <div style={{ color: '#b30000' }}>Error: {ex.errorMessage}</div>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button
                                type="button"
                                onClick={() => setExpandedExecs(s => ({ ...s, [ex.id]: !expanded }))}
                                style={{ fontSize: '0.6rem' }}
                              >{expanded ? 'Ocultar' : 'Ver cuerpo'}</button>
                              <button
                                type="button"
                                onClick={() => {
                                  try {
                                    const text = JSON.stringify(ex.responseBodyJson, null, 2);
                                    navigator.clipboard.writeText(text);
                                    pushLog('Copiado cuerpo ejecución');
                                  } catch (err: any) {
                                    showError('copiar cuerpo: ' + err.message);
                                  }
                                }}
                                style={{ fontSize: '0.6rem' }}
                              >Copiar</button>
                              <button
                                type="button"
                                onClick={() => setLastExecution(ex)}
                                style={{ fontSize: '0.6rem' }}
                              >Seleccionar</button>
                            </div>
                          </div>
                          {expanded && (
                            <pre style={{ marginTop: '0.35rem', maxHeight: 160, overflow: 'auto', background: '#1e1e1e', color: '#dcdcdc', padding: '0.4rem', fontSize: '0.55rem', borderRadius: 4 }}>
{JSON.stringify(ex.responseBodyJson, null, 2)}
                            </pre>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
        {/* Columna Log */}
        <section style={{ border: '1px solid #ddd', borderRadius: 6, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Log</h2>
          <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', overflow: 'auto', flex: 1 }}>
            {log.map(l => (
              <li key={l.id}>{new Date(l.ts).toLocaleTimeString()} - {l.msg}</li>
            ))}
          </ol>
        </section>
      </main>
      <footer style={{ fontSize: '0.7rem', color: '#666' }}>Frontend experimental - ajustar según necesidades.</footer>
    </div>
  );
}
