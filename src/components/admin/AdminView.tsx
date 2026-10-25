import React, { useState, useEffect } from 'react';
import { Shield, Users, Target, BookOpen, BarChart3, FileText, Lock, Unlock, Search, Plus, Database } from 'lucide-react';
import { UserProfile, Concurso, Disciplina, Assunto, StudyCycle } from '../../types';
import { Card, CardHeader, CardBody } from '../../design-system/Card';
import { Button } from '../../design-system/Button';
import { Badge } from '../../design-system/Badge';
import { Input } from '../../design-system/Input';
import { ModalAdminEdital } from './ModalAdminEdital';
import { SupabaseEditaisService, SupabaseEdital } from '../../services/supabaseEditais';

interface AdminViewProps {
  user: UserProfile;
  concursos: Concurso[];
  disciplinas: Disciplina[];
  assuntos: Assunto[];
  studyCycles: StudyCycle[];
  onUpdateUserRoleOrStatus?: (userId: string, blocked: boolean) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  user,
  concursos,
  disciplinas,
  assuntos,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'usuarios' | 'concursos' | 'editais' | 'disciplinas' | 'metricas'>('usuarios');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editaisList, setEditaisList] = useState<SupabaseEdital[]>([]);
  const [isLoadingEditais, setIsLoadingEditais] = useState(false);
  const [usuariosList, setUsuariosList] = useState<any[]>([
    { id: 'user_01', name: 'Estudante Concurseiro', email: 'compras@crfgo.org.br', role: 'admin', blocked: false, lastActive: 'Hoje' },
    { id: 'user_02', name: 'Mariana Silva', email: 'mariana.silva@exam.com', role: 'aluno', blocked: false, lastActive: 'Ontem' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  const carregarEditais = () => {
    setIsLoadingEditais(true);
    SupabaseEditaisService.getEditais()
      .then(data => setEditaisList(data))
      .catch(() => setEditaisList([]))
      .finally(() => setIsLoadingEditais(false));
  };

  useEffect(() => {
    if (activeAdminTab === 'editais') {
      carregarEditais();
    }
  }, [activeAdminTab]);

  if (user.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 text-center space-y-4">
        <Lock className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-black">Acesso Restrito & Protegido</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Esta área é restrita a administradores. Seu usuário possui a role "{user.role}".
        </p>
      </div>
    );
  }

  const toggleUserBlock = (userId: string) => {
    setUsuariosList(prev => prev.map(u => u.id === userId ? { ...u, blocked: !u.blocked } : u));
  };

  const filteredUsers = usuariosList.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
            <Shield className="w-6 h-6 text-rose-600" />
            Painel de Administração Global (RBAC)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">Controle total de usuários e concursos.</p>
        </div>
        <Badge variant="rose" size="md">Admin ({user.email})</Badge>
      </div>

      <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto text-xs">
        <button onClick={() => setActiveAdminTab('usuarios')} className={`px-4 py-2 rounded-lg font-bold ${activeAdminTab === 'usuarios' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Usuários</button>
        <button onClick={() => setActiveAdminTab('concursos')} className={`px-4 py-2 rounded-lg font-bold ${activeAdminTab === 'concursos' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Concursos</button>
        <button onClick={() => setActiveAdminTab('editais')} className={`px-4 py-2 rounded-lg font-bold ${activeAdminTab === 'editais' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Editais (Supabase)</button>
        <button onClick={() => setActiveAdminTab('disciplinas')} className={`px-4 py-2 rounded-lg font-bold ${activeAdminTab === 'disciplinas' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Disciplinas</button>
        <button onClick={() => setActiveAdminTab('metricas')} className={`px-4 py-2 rounded-lg font-bold ${activeAdminTab === 'metricas' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Métricas</button>
      </div>

      {activeAdminTab === 'usuarios' && (
        <Card>
          <CardHeader title="Usuários" action={<div className="w-64"><Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} leftIcon={<Search className="w-4 h-4" />} /></div>} />
          <CardBody className="p-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-slate-400">
                  <th className="p-2">Nome</th>
                  <th className="p-2">E-mail</th>
                  <th className="p-2">Role</th>
                  <th className="p-2 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td className="p-2 font-bold">{u.name}</td>
                    <td className="p-2 text-slate-500">{u.email}</td>
                    <td className="p-2"><Badge variant="purple" size="sm">{u.role}</Badge></td>
                    <td className="p-2 text-right">
                      <Button size="sm" variant={u.blocked ? 'primary' : 'outline'} onClick={() => toggleUserBlock(u.id)}>
                        {u.blocked ? 'Desbloquear' : 'Bloquear'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {activeAdminTab === 'concursos' && (
        <Card>
          <CardHeader title="Concursos Cadastrados" />
          <CardBody className="p-6 space-y-3">
            {concursos.map(c => (
              <div key={c.id} className="p-3 border rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold">{c.title}</span>
                <Badge variant="emerald" size="sm">{c.status}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {activeAdminTab === 'editais' && (
        <Card>
          <CardHeader 
            title="Editais no Supabase" 
            action={
              <Button 
                size="sm" 
                variant="primary" 
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsAdminModalOpen(true)}
              >
                + Cadastrar Edital
              </Button>
            } 
          />
          <CardBody className="p-6 space-y-3">
            {isLoadingEditais ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Carregando editais do Supabase...
              </div>
            ) : editaisList.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-slate-400">Nenhum edital cadastrado no Supabase.</p>
                <Button size="sm" variant="outline" onClick={() => setIsAdminModalOpen(true)}>
                  Cadastrar Primeiro Edital
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {editaisList.map((edital, idx) => (
                  <div key={edital.id || idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {edital.titulo || edital.title}
                      </p>
                      <p className="text-slate-500 truncate">
                        {edital.orgao || edital.organ} • {edital.cargo || edital.role} • Banca: {edital.banca}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="purple" size="sm">{edital.esfera || 'Geral'}</Badge>
                      <Badge variant="emerald" size="sm">{edital.status || 'Publicado'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeAdminTab === 'disciplinas' && (
        <Card>
          <CardHeader title="Disciplinas Globais" />
          <CardBody className="p-6 space-y-2">
            {disciplinas.map(d => (
              <div key={d.id} className="p-2.5 border rounded-lg text-xs flex justify-between">
                <span className="font-bold">{d.name}</span>
                <Badge variant="purple" size="sm">Peso {d.weight}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {activeAdminTab === 'metricas' && (
        <div className="grid grid-cols-3 gap-4">
          <Card><CardBody className="p-5"><span className="text-xs text-slate-400">Usuários</span><div className="text-3xl font-black">{usuariosList.length}</div></CardBody></Card>
          <Card><CardBody className="p-5"><span className="text-xs text-slate-400">Concursos</span><div className="text-3xl font-black">{concursos.length}</div></CardBody></Card>
          <Card><CardBody className="p-5"><span className="text-xs text-slate-400">Disciplinas</span><div className="text-3xl font-black">{disciplinas.length}</div></CardBody></Card>
        </div>
      )}

      {/* Modal de Cadastro de Edital */}
      <ModalAdminEdital
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onEditalCreated={() => {
          carregarEditais();
        }}
      />
    </div>
  );
};
