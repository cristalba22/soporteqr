import { UserRole } from '@soporteqr/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

import {
  createCategory,
  createLocation,
  createUser,
  deleteCategory,
  deleteLocation,
  getCategories,
  getLocations,
  getUsers,
  updateCategory,
  updateLocation,
  updateUser,
  type CategoryAdmin,
  type LocationOption,
  type UserAdmin,
} from '../lib/api';
import { useAuth } from '../context/AuthContext';

type Tab = 'usuarios' | 'ubicaciones' | 'categorias';

const TAB_LABELS: Record<Tab, string> = {
  usuarios: 'Usuarios',
  ubicaciones: 'Ubicaciones',
  categorias: 'Categorias',
};

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMINISTRADOR]: 'Administrador',
  [UserRole.TECNICO]: 'Tecnico',
  [UserRole.EMPLEADO]: 'Empleado',
};

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('usuarios');

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl bg-marino-950 p-6 text-white shadow-panel sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex rounded-full bg-turquesa-500/15 px-3 py-1 text-xs font-semibold text-turquesa-300">
            Control central
          </span>
          <h1 className="mt-3 text-2xl font-semibold">Administracion</h1>
          <p className="mt-1 max-w-2xl text-sm text-marino-200">
            Gestiona accesos, estructura operativa y clasificacion de incidencias con trazabilidad.
          </p>
        </div>
        <p className="text-xs text-marino-300">Los cambios quedan registrados en auditoria</p>
      </header>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-grafito-200 bg-white p-1.5 shadow-panel">
        {(Object.keys(TAB_LABELS) as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`min-w-32 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === item ? 'bg-marino-950 text-white' : 'text-grafito-600 hover:bg-grafito-100'
            }`}
          >
            {TAB_LABELS[item]}
          </button>
        ))}
      </div>

      {tab === 'usuarios' && <UsersPanel />}
      {tab === 'ubicaciones' && <LocationsPanel />}
      {tab === 'categorias' && <CategoriesPanel />}
    </div>
  );
}

function UsersPanel() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: ['admin-users'], queryFn: getUsers });
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: getLocations });
  const [editing, setEditing] = useState<UserAdmin | 'new' | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nombre: '', email: '', password: '', role: UserRole.EMPLEADO as UserRole, locationId: '' });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing === 'new') {
        return createUser({ ...form, locationId: form.locationId || null });
      }
      if (!editing) throw new Error('Usuario invalido');
      return updateUser(editing.id, { nombre: form.nombre, role: form.role, locationId: form.locationId || null });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      closeEditor();
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'No se pudo guardar el usuario'),
  });

  const statusMutation = useMutation({
    mutationFn: (user: UserAdmin) => updateUser(user.id, { activo: !user.activo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const openNew = () => {
    setForm({ nombre: '', email: '', password: '', role: UserRole.EMPLEADO, locationId: '' });
    setEditing('new');
    setError('');
  };
  const openEdit = (user: UserAdmin) => {
    setForm({ nombre: user.nombre, email: user.email, password: '', role: user.role, locationId: user.locationId ?? '' });
    setEditing(user);
    setError('');
  };
  const closeEditor = () => {
    setEditing(null);
    setError('');
  };
  const editingSelf = editing !== null && editing !== 'new' && editing.id === currentUser?.id;

  return (
    <AdminSection title="Usuarios y permisos" description="Altas, roles y estado de acceso" action="Nuevo usuario" onAction={openNew}>
      {editing && (
        <form onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }} className="mb-5 rounded-xl border border-turquesa-200 bg-turquesa-50 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-marino-950">{editing === 'new' ? 'Crear usuario' : 'Editar usuario'}</h3>
            <button type="button" onClick={closeEditor} className="text-sm font-medium text-grafito-500 hover:text-marino-900">Cancelar</button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Nombre" value={form.nombre} required onChange={(nombre) => setForm({ ...form, nombre })} />
            <Field label="Email" type="email" value={form.email} required disabled={editing !== 'new'} onChange={(email) => setForm({ ...form, email })} />
            {editing === 'new' && <Field label="Contraseña inicial" type="password" value={form.password} required minLength={8} onChange={(password) => setForm({ ...form, password })} />}
            <SelectField label="Rol" value={form.role} disabled={editingSelf} onChange={(role) => setForm({ ...form, role: role as UserRole })} options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))} />
            <SelectField label="Ubicacion" value={form.locationId} onChange={(locationId) => setForm({ ...form, locationId })} options={[{ value: '', label: 'Sin ubicacion' }, ...(locationsQuery.data ?? []).map((location) => ({ value: location.id, label: location.nombre }))]} />
          </div>
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          <button disabled={saveMutation.isPending} className="mt-4 rounded-lg bg-marino-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {saveMutation.isPending ? 'Guardando...' : 'Guardar usuario'}
          </button>
        </form>
      )}

      <TableShell loading={usersQuery.isLoading} error={usersQuery.isError} empty={!usersQuery.data?.length} columns={['Usuario', 'Rol', 'Ubicacion', 'Estado', 'Acciones']}>
        {usersQuery.data?.map((user) => {
          const location = locationsQuery.data?.find((item) => item.id === user.locationId);
          return (
            <tr key={user.id} className="border-t border-grafito-200 hover:bg-grafito-100/60">
              <td className="px-4 py-3"><p className="font-semibold text-marino-900">{user.nombre}</p><p className="text-xs text-grafito-500">{user.email}</p></td>
              <td className="px-4 py-3 text-grafito-700">{ROLE_LABELS[user.role]}</td>
              <td className="px-4 py-3 text-grafito-600">{location?.nombre ?? 'Sin asignar'}</td>
              <td className="px-4 py-3"><Status active={user.activo} /></td>
              <td className="px-4 py-3"><div className="flex gap-3"><Action onClick={() => openEdit(user)}>Editar</Action><Action danger={user.activo} disabled={user.id === currentUser?.id} title={user.id === currentUser?.id ? 'No puedes desactivar tu propia cuenta' : undefined} onClick={() => statusMutation.mutate(user)}>{user.activo ? 'Desactivar' : 'Activar'}</Action></div></td>
            </tr>
          );
        })}
      </TableShell>
    </AdminSection>
  );
}

function LocationsPanel() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['locations'], queryFn: getLocations });
  const [editing, setEditing] = useState<LocationOption | 'new' | null>(null);
  const [form, setForm] = useState({ nombre: '', direccion: '' });
  const [error, setError] = useState('');
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['locations'] });
  const saveMutation = useMutation({
    mutationFn: () => editing === 'new' ? createLocation(form) : updateLocation((editing as LocationOption).id, form),
    onSuccess: async () => { await refresh(); setEditing(null); setError(''); },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'No se pudo guardar la ubicacion'),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteLocation,
    onSuccess: refresh,
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'No se pudo eliminar la ubicacion'),
  });
  const open = (item: LocationOption | 'new') => {
    setEditing(item);
    setForm(item === 'new' ? { nombre: '', direccion: '' } : { nombre: item.nombre, direccion: item.direccion ?? '' });
    setError('');
  };

  return (
    <AdminSection title="Ubicaciones" description="Sedes, sectores y puntos operativos" action="Nueva ubicacion" onAction={() => open('new')}>
      <SimpleEditor visible={Boolean(editing)} title={editing === 'new' ? 'Crear ubicacion' : 'Editar ubicacion'} pending={saveMutation.isPending} error={error} onCancel={() => setEditing(null)} onSubmit={() => saveMutation.mutate()}>
        <Field label="Nombre" value={form.nombre} required onChange={(nombre) => setForm({ ...form, nombre })} />
        <Field label="Direccion" value={form.direccion} onChange={(direccion) => setForm({ ...form, direccion })} />
      </SimpleEditor>
      <TableShell loading={query.isLoading} error={query.isError} empty={!query.data?.length} columns={['Ubicacion', 'Usuarios', 'Activos', 'Tickets', 'Acciones']}>
        {query.data?.map((item) => {
          const used = Boolean(item._count && (item._count.users || item._count.assets || item._count.tickets));
          return <tr key={item.id} className="border-t border-grafito-200 hover:bg-grafito-100/60">
            <td className="px-4 py-3"><p className="font-semibold text-marino-900">{item.nombre}</p><p className="text-xs text-grafito-500">{item.direccion || 'Sin direccion'}</p></td>
            <td className="px-4 py-3 text-grafito-700">{item._count?.users ?? 0}</td><td className="px-4 py-3 text-grafito-700">{item._count?.assets ?? 0}</td><td className="px-4 py-3 text-grafito-700">{item._count?.tickets ?? 0}</td>
            <td className="px-4 py-3"><div className="flex gap-3"><Action onClick={() => open(item)}>Editar</Action><Action danger disabled={used} title={used ? 'Tiene elementos asociados' : undefined} onClick={() => { if (window.confirm(`Eliminar ${item.nombre}?`)) deleteMutation.mutate(item.id); }}>Eliminar</Action></div></td>
          </tr>;
        })}
      </TableShell>
    </AdminSection>
  );
}

function CategoriesPanel() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin-categories'], queryFn: getCategories });
  const [editing, setEditing] = useState<CategoryAdmin | 'new' | null>(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [error, setError] = useState('');
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
  const saveMutation = useMutation({
    mutationFn: () => editing === 'new' ? createCategory(form) : updateCategory((editing as CategoryAdmin).id, form),
    onSuccess: async () => { await refresh(); setEditing(null); setError(''); },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'No se pudo guardar la categoria'),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: refresh,
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'No se pudo eliminar la categoria'),
  });
  const open = (item: CategoryAdmin | 'new') => {
    setEditing(item);
    setForm(item === 'new' ? { nombre: '', descripcion: '' } : { nombre: item.nombre, descripcion: item.descripcion ?? '' });
    setError('');
  };

  return (
    <AdminSection title="Categorias" description="Clasificacion consistente para reportes y metricas" action="Nueva categoria" onAction={() => open('new')}>
      <SimpleEditor visible={Boolean(editing)} title={editing === 'new' ? 'Crear categoria' : 'Editar categoria'} pending={saveMutation.isPending} error={error} onCancel={() => setEditing(null)} onSubmit={() => saveMutation.mutate()}>
        <Field label="Nombre" value={form.nombre} required onChange={(nombre) => setForm({ ...form, nombre })} />
        <Field label="Descripcion" value={form.descripcion} onChange={(descripcion) => setForm({ ...form, descripcion })} />
      </SimpleEditor>
      <TableShell loading={query.isLoading} error={query.isError} empty={!query.data?.length} columns={['Categoria', 'Tickets asociados', 'Disponibilidad', 'Acciones']}>
        {query.data?.map((item) => <tr key={item.id} className="border-t border-grafito-200 hover:bg-grafito-100/60">
          <td className="px-4 py-3"><p className="font-semibold text-marino-900">{item.nombre}</p><p className="text-xs text-grafito-500">{item.descripcion || 'Sin descripcion'}</p></td>
          <td className="px-4 py-3 text-grafito-700">{item._count.tickets}</td>
          <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item._count.tickets ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{item._count.tickets ? 'En uso' : 'Disponible'}</span></td>
          <td className="px-4 py-3"><div className="flex gap-3"><Action onClick={() => open(item)}>Editar</Action><Action danger disabled={item._count.tickets > 0} title={item._count.tickets ? 'Tiene tickets asociados' : undefined} onClick={() => { if (window.confirm(`Eliminar ${item.nombre}?`)) deleteMutation.mutate(item.id); }}>Eliminar</Action></div></td>
        </tr>)}
      </TableShell>
    </AdminSection>
  );
}

function AdminSection({ title, description, action, onAction, children }: { title: string; description: string; action: string; onAction: () => void; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-grafito-200 bg-white p-5 shadow-panel"><div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-lg font-semibold text-marino-950">{title}</h2><p className="text-sm text-grafito-500">{description}</p></div><button type="button" onClick={onAction} className="shrink-0 rounded-lg bg-turquesa-500 px-4 py-2.5 text-sm font-semibold text-marino-950 hover:bg-turquesa-400">{action}</button></div>{children}</section>;
}

function SimpleEditor({ visible, title, pending, error, onCancel, onSubmit, children }: { visible: boolean; title: string; pending: boolean; error: string; onCancel: () => void; onSubmit: () => void; children: React.ReactNode }) {
  if (!visible) return null;
  return <form onSubmit={(event: FormEvent) => { event.preventDefault(); onSubmit(); }} className="mb-5 rounded-xl border border-turquesa-200 bg-turquesa-50 p-5"><div className="flex items-center justify-between"><h3 className="font-semibold text-marino-950">{title}</h3><button type="button" onClick={onCancel} className="text-sm text-grafito-500">Cancelar</button></div><div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>{error && <p className="mt-3 text-sm text-red-700">{error}</p>}<button disabled={pending} className="mt-4 rounded-lg bg-marino-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{pending ? 'Guardando...' : 'Guardar cambios'}</button></form>;
}

function TableShell({ loading, error, empty, columns, children }: { loading: boolean; error: boolean; empty: boolean; columns: string[]; children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border border-grafito-200"><table className="min-w-full text-left text-sm"><thead className="bg-grafito-100 text-xs uppercase tracking-wide text-grafito-500"><tr>{columns.map((column) => <th key={column} className="px-4 py-3 font-semibold">{column}</th>)}</tr></thead><tbody>{loading && <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-grafito-500">Cargando...</td></tr>}{error && <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-red-700">No se pudieron cargar los datos.</td></tr>}{!loading && !error && empty && <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-grafito-500">No hay registros.</td></tr>}{children}</tbody></table></div>;
}

function Field({ label, value, onChange, type = 'text', required, disabled, minLength }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; disabled?: boolean; minLength?: number }) {
  return <label className="text-sm font-medium text-marino-900">{label}<input type={type} value={value} required={required} disabled={disabled} minLength={minLength} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-lg border border-grafito-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-turquesa-500 disabled:bg-grafito-100" /></label>;
}

function SelectField({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; disabled?: boolean }) {
  return <label className="text-sm font-medium text-marino-900">{label}<select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-lg border border-grafito-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-turquesa-500 disabled:bg-grafito-100">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function Status({ active }: { active: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-grafito-100 text-grafito-600'}`}>{active ? 'Activo' : 'Inactivo'}</span>;
}

function Action({ children, onClick, danger, disabled, title }: { children: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean; title?: string }) {
  return <button type="button" onClick={onClick} disabled={disabled} title={title} className={`text-xs font-semibold disabled:cursor-not-allowed disabled:text-grafito-300 ${danger ? 'text-red-600 hover:text-red-700' : 'text-turquesa-700 hover:text-turquesa-800'}`}>{children}</button>;
}
