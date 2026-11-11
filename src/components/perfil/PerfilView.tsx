import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Clock, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Target, 
  Bell, 
  Shield, 
  Palette, 
  Save, 
  CheckCircle2, 
  LogOut, 
  Sparkles, 
  Database,
  Download,
  Trash2,
  AlertTriangle,
  FileText,
  Camera,
  Eye,
  EyeOff,
  Loader2,
  Check
} from 'lucide-react';
import { UserProfile, Concurso } from '../../types';
import { Card, CardHeader, CardBody } from '../../design-system/Card';
import { Button } from '../../design-system/Button';
import { Input } from '../../design-system/Input';
import { Badge } from '../../design-system/Badge';
import { ThemeToggle } from '../../design-system/ThemeToggle';
import { Modal } from '../../design-system/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { DatabaseService } from '../../services/db';
import { PrivacyPolicyModal } from '../privacy/PrivacyPolicyModal';
import { ProfilePhotoModal } from './ProfilePhotoModal';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { useTheme } from '../../contexts/ThemeContext';

interface PerfilViewProps {
  user: UserProfile;
  concursos: Concurso[];
  activeConcursoId?: string;
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  onDataSanitized?: () => void;
}

export const PerfilView: React.FC<PerfilViewProps> = ({
  user,
  concursos,
  activeConcursoId,
  onUpdateProfile,
  onDataSanitized,
}) => {
  const { logout, deleteAccount, changePassword } = useAuth();
  const { effectiveTheme } = useTheme();
  const isDarkMode = effectiveTheme === 'dark';
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITEKEY || '0x4AAAAAAAF6vRO8n_yCS06wS';
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'perfil' | 'seguranca'>('perfil');

  const MOCK_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=250',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
  ];

  const [currentPhotoURL, setCurrentPhotoURL] = useState(
    user.photoURL || MOCK_AVATARS[0]
  );
  const [photoFeedback, setPhotoFeedback] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const handlePhotoSelected = (photoUrl: string) => {
    setCurrentPhotoURL(photoUrl);
    onUpdateProfile({ photoURL: photoUrl });
    setPhotoFeedback('Foto de perfil atualizada com sucesso!');
    setTimeout(() => setPhotoFeedback(null), 3500);
  };

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [gender, setGender] = useState(user.gender || user.preferences?.gender || 'Não Informado');
  const [birthDate, setBirthDate] = useState(user.birthDate || user.preferences?.birthDate || '');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarPopoverRef = useRef<HTMLDivElement>(null);

  const parseBirthDateParts = (val: string) => {
    const parts = val.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y >= 1900 && y <= new Date().getFullYear() && m >= 0 && m <= 11) {
        return { day: d, month: m, year: y };
      }
    }
    return null;
  };

  const initialParsed = parseBirthDateParts(user.birthDate || user.preferences?.birthDate || '');
  const [calMonth, setCalMonth] = useState<number>(initialParsed ? initialParsed.month : 0);
  const [calYear, setCalYear] = useState<number>(initialParsed ? initialParsed.year : 2000);

  useEffect(() => {
    if (!isCalendarOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarPopoverRef.current && !calendarPopoverRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  const [studyHoursPerDay, setStudyHoursPerDay] = useState(String(user.studyHoursPerDay || 4));
  const [targetConcursoId, setTargetConcursoId] = useState(user.targetConcursoId || '');

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    setBirthDate(formatted);
    const parsed = parseBirthDateParts(formatted);
    if (parsed) {
      setCalMonth(parsed.month);
      setCalYear(parsed.year);
    }
  };

  const handleSelectCalendarDay = (day: number) => {
    const dd = String(day).padStart(2, '0');
    const mm = String(calMonth + 1).padStart(2, '0');
    const yyyy = String(calYear);
    setBirthDate(`${dd}/${mm}/${yyyy}`);
    setIsCalendarOpen(false);
  };

  const MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: currentYear - 1929 }, (_, i) => currentYear - i);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const selectedParsed = parseBirthDateParts(birthDate);
  const [pomodoroWork, setPomodoroWork] = useState(String(user.preferences?.pomodoroWorkMin || 50));
  const [pomodoroBreak, setPomodoroBreak] = useState(String(user.preferences?.pomodoroBreakMin || 10));
  const [notificationsEnabled, setNotificationsEnabled] = useState(user.preferences?.notificationsEnabled ?? true);
  const [emailAlerts, setEmailAlerts] = useState(user.preferences?.emailAlerts ?? true);
  
  const [notifPrefs, setNotifPrefs] = useState(user.preferences?.notificationPreferences || {
    inApp: {
      estudoProgramado: true,
      revisao: true,
      meta: true,
      simulado: true,
      provaProxima: true,
      sessaoAtrasada: true,
      conquistas: true,
    },
    push: {
      estudoProgramado: false,
      revisao: true,
      meta: false,
      simulado: true,
      provaProxima: true,
      sessaoAtrasada: true,
      conquistas: false,
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isSanitizing, setIsSanitizing] = useState(false);
  const [isResetHistoryModalOpen, setIsResetHistoryModalOpen] = useState(false);
  const [isResettingHistory, setIsResettingHistory] = useState(false);
  const [maintenanceFeedback, setMaintenanceFeedback] = useState<string | null>(null);

  const handleSanitizeOrphanData = async () => {
    setIsSanitizing(true);
    setMaintenanceFeedback(null);
    try {
      const { removedCount } = await DatabaseService.sanitizeOrphanData();
      onDataSanitized?.();
      setMaintenanceFeedback(
        `${removedCount} registros órfãos foram removidos com sucesso. Seu banco de dados está sincronizado!`
      );
      setTimeout(() => setMaintenanceFeedback(null), 6000);
    } catch (err) {
      console.error('Erro ao otimizar banco de dados:', err);
    } finally {
      setIsSanitizing(false);
    }
  };

  const handleResetConcursoHistoryConfirm = async () => {
    const targetId = activeConcursoId || user.targetConcursoId || concursos[0]?.id || '';
    setIsResettingHistory(true);
    setMaintenanceFeedback(null);
    try {
      if (targetId) {
        await DatabaseService.resetConcursoHistory(targetId);
      }
      await DatabaseService.sanitizeOrphanData();
      onDataSanitized?.();
      setIsResetHistoryModalOpen(false);
      setMaintenanceFeedback('Histórico do concurso ativo resetado com sucesso! Suas matérias e tópicos do edital foram mantidos intactos.');
      setTimeout(() => setMaintenanceFeedback(null), 6000);
    } catch (err) {
      console.error('Erro ao resetar histórico do concurso:', err);
    } finally {
      setIsResettingHistory(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const selectedConcurso = concursos.find(c => c.id === targetConcursoId);
      await onUpdateProfile({
        name,
        bio,
        gender,
        birthDate,
        photoURL: currentPhotoURL,
        studyHoursPerDay: parseFloat(studyHoursPerDay) || 4,
        targetConcursoId: targetConcursoId || undefined,
        targetConcursoTitle: selectedConcurso ? selectedConcurso.title : user.targetConcursoTitle,
        preferences: {
          ...user.preferences,
          gender,
          birthDate,
          pomodoroWorkMin: parseInt(pomodoroWork, 10) || 50,
          pomodoroBreakMin: parseInt(pomodoroBreak, 10) || 10,
          notificationsEnabled,
          emailAlerts,
          notificationPreferences: notifPrefs,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (e) {
      console.error('Erro ao atualizar perfil', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const jsonStr = await DatabaseService.exportUserData(user.id);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gabarita_dados_usuario_${user.id}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao exportar dados:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    try {
      await deleteAccount();
    } catch (e) {
      console.error('Erro ao excluir conta:', e);
    }
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword.trim()) {
      setPasswordFeedback({ type: 'error', message: 'Por favor, informe sua senha atual.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordFeedback({ type: 'error', message: 'A confirmação da nova senha não coincide.' });
      return;
    }
    if (!captchaToken) {
      setPasswordFeedback({
        type: 'error',
        message: 'Por favor, complete a verificação anti-robô (Cloudflare Turnstile) antes de prosseguir.',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword, captchaToken);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setCaptchaToken(null);
      turnstileRef.current?.reset();
      setPasswordFeedback({
        type: 'success',
        message: 'Senha alterada com sucesso! Você permanece conectado apenas neste dispositivo.',
      });
      setTimeout(() => setPasswordFeedback(null), 6000);
    } catch (err: any) {
      turnstileRef.current?.reset();
      setCaptchaToken(null);
      setPasswordFeedback({
        type: 'error',
        message: err?.message || 'Não foi possível alterar a senha. Verifique seus dados e tente novamente.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Barra de Abas: Perfil | Segurança */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-8">
        <button
          type="button"
          onClick={() => setActiveSection('perfil')}
          className={`pb-3 text-sm sm:text-base font-semibold transition-all relative cursor-pointer ${
            activeSection === 'perfil'
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Perfil
          {activeSection === 'perfil' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('seguranca')}
          className={`pb-3 text-sm sm:text-base font-semibold transition-all relative cursor-pointer ${
            activeSection === 'seguranca'
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Segurança
          {activeSection === 'seguranca' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>
      </div>

      {activeSection === 'perfil' && (
        <>
      <Card className="flashcards-daily-review-card overflow-hidden">
        <CardBody className="dashboard-themed-header p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Foto de Perfil Interativa com Efeito Hover e Abertura do Modal de Câmera/Galeria */}
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={() => setIsPhotoModalOpen(true)}
              className="relative block rounded-2xl overflow-hidden focus:outline-none focus:ring-4 focus:ring-emerald-500/40 cursor-pointer shadow-md transition-all group-hover:scale-105"
              title="Clique para alterar a foto de perfil"
              aria-label="Alterar foto de perfil"
            >
              <img
                src={currentPhotoURL}
                alt={user.name}
                className="w-24 h-24 object-cover border-2 border-emerald-500 group-hover:brightness-75 transition-all duration-200"
              />
              {/* Overlay sutil ao passar o mouse ou focar */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                <Camera className="w-6 h-6 stroke-[2.2] animate-bounce" />
                <span className="text-[10px] font-bold mt-1 tracking-tight">Alterar foto</span>
              </div>
            </button>

            {/* Ícone de câmera sobreposto fixo no canto inferior */}
            <button
              type="button"
              onClick={() => setIsPhotoModalOpen(true)}
              className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-emerald-500 text-white shadow-lg border-2 border-white dark:border-slate-900 group-hover:bg-emerald-600 transition-all cursor-pointer hover:scale-110"
              title="Alterar foto de perfil"
              aria-label="Alterar foto de perfil"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            {photoFeedback && (
              <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-emerald-900/90 text-emerald-200 px-2 py-0.5 rounded-md font-medium shadow-md animate-fade-in z-20">
                {photoFeedback}
              </span>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                {user.name}
              </h2>
              <Badge variant="purple" size="sm">
                {user.role?.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic pt-1">
              "{user.bio || 'Focado na aprovação constante e disciplina diária.'}"
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span>🔥 {user.streakDays} dias de sequência</span>
              {/* Oculto enquanto o menu "Metas & Desempenho" estiver desativado: <span>⚡ {user.xp} XP totais</span> */}
              <span>🎯 {user.targetConcursoTitle || 'Plano Personalizado'}</span>
            </div>
          </div>
        </CardBody>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Perfil e preferências atualizados com sucesso!</span>
          </div>
        )}

        <Card className="overflow-hidden">
          <CardHeader
            title="Dados do Concurseiro"
            subtitle="Suas informações principais de identificação e rotina"
            className="dashboard-themed-header"
          />
          <CardBody className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nome de Exibição"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />
              <Input
                label="E-mail Cadastrado"
                value={user.email}
                disabled
                leftIcon={<Mail className="w-4 h-4" />}
                helperText="O e-mail é vinculado ao seu login e não pode ser alterado diretamente."
              />
            </div>
            <Input
              label="Bio / Lema de Estudo"
              placeholder="Ex: Não pare até ser nomeado."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Sexo
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-3.5 py-2.5"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                  <option value="Não Informado">Não Informado</option>
                </select>
              </div>
              <Input
                label="Data de Nascimento"
                type="text"
                inputMode="numeric"
                placeholder="DD/MM/AAAA"
                maxLength={10}
                value={birthDate}
                onChange={handleBirthDateChange}
                leftIcon={<Calendar className="w-4 h-4" />}
                rightIcon={
                  <div className="relative flex items-center justify-center" ref={calendarPopoverRef}>
                    <button
                      type="button"
                      onClick={() => {
                        const parsed = parseBirthDateParts(birthDate);
                        if (parsed) {
                          setCalMonth(parsed.month);
                          setCalYear(parsed.year);
                        }
                        setIsCalendarOpen(prev => !prev);
                      }}
                      title="Escolher no calendário"
                      aria-label="Escolher data de nascimento no calendário"
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        isCalendarOpen
                          ? 'text-emerald-500 bg-emerald-500/10'
                          : 'text-slate-400 hover:text-emerald-500 dark:text-slate-500 dark:hover:text-emerald-400'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                    </button>

                    {isCalendarOpen && (
                      <div className="absolute right-0 top-full mt-2 w-72 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl z-50 text-slate-900 dark:text-slate-100">
                        <div className="flex items-center justify-between gap-1.5 mb-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (calMonth === 0) {
                                setCalMonth(11);
                                setCalYear(y => Math.max(1930, y - 1));
                              } else {
                                setCalMonth(m => m - 1);
                              }
                            }}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                            title="Mês anterior"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <div className="flex items-center gap-1 flex-1 justify-center">
                            <select
                              value={calMonth}
                              onChange={(e) => setCalMonth(Number(e.target.value))}
                              className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-1 text-slate-800 dark:text-slate-100 cursor-pointer"
                            >
                              {MONTHS_PT.map((m, idx) => (
                                <option key={m} value={idx}>{m}</option>
                              ))}
                            </select>
                            <select
                              value={calYear}
                              onChange={(e) => setCalYear(Number(e.target.value))}
                              className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-1 text-slate-800 dark:text-slate-100 cursor-pointer"
                            >
                              {yearsList.map((yr) => (
                                <option key={yr} value={yr}>{yr}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (calMonth === 11) {
                                setCalMonth(0);
                                setCalYear(y => Math.min(currentYear, y + 1));
                              } else {
                                setCalMonth(m => m + 1);
                              }
                            }}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                            title="Próximo mês"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">
                          <span>D</span>
                          <span>S</span>
                          <span>T</span>
                          <span>Q</span>
                          <span>Q</span>
                          <span>S</span>
                          <span>S</span>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center">
                          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                            <span key={`empty-${idx}`} className="h-7" />
                          ))}
                          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
                            const isSelected =
                              selectedParsed &&
                              selectedParsed.day === dayNum &&
                              selectedParsed.month === calMonth &&
                              selectedParsed.year === calYear;
                            return (
                              <button
                                key={dayNum}
                                type="button"
                                onClick={() => handleSelectCalendarDay(dayNum)}
                                className={`h-7 w-full rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-emerald-500 text-white font-bold shadow-xs'
                                    : 'text-slate-700 dark:text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400'
                                }`}
                              >
                                {dayNum}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                          <button
                            type="button"
                            onClick={() => {
                              setBirthDate('');
                              setIsCalendarOpen(false);
                            }}
                            className="text-slate-400 hover:text-rose-500 font-medium cursor-pointer"
                          >
                            Limpar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const now = new Date();
                              setCalMonth(now.getMonth());
                              setCalYear(now.getFullYear());
                              const dd = String(now.getDate()).padStart(2, '0');
                              const mm = String(now.getMonth() + 1).padStart(2, '0');
                              setBirthDate(`${dd}/${mm}/${now.getFullYear()}`);
                              setIsCalendarOpen(false);
                            }}
                            className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                          >
                            Hoje
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                }
              />
            </div>
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Aparência & Tema"
            subtitle="Escolha entre o modo escuro, claro ou automático do sistema"
            className="dashboard-themed-header"
          />
          <CardBody className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Tema da Interface
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                O modo escuro reduz a fadiga visual durante longas sessões de leitura.
              </p>
            </div>
            <ThemeToggle />
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Privacidade, LGPD & Dados do Usuário"
            subtitle="Exportação completa de dados e termos de privacidade"
            className="dashboard-themed-header"
          />
          <CardBody className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    Política de Privacidade & Termos de Uso
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Consulte como seus dados de estudo são isolados e protegidos.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPrivacyModalOpen(true)}
              >
                Ver Política
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    Exportar Meus Dados (Backup JSON)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Baixe uma cópia completa de todo o seu histórico de estudos, questões e plano.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isExporting}
                onClick={handleExportData}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Exportar JSON
              </Button>
            </div>
          </CardBody>
        </Card>

        {user.role === 'admin' && (
          <Card className="overflow-hidden">
            <CardHeader
              title="Infraestrutura & Armazenamento"
              subtitle="Status da conexão e manutenção de integridade de dados do Gabarita"
              className="dashboard-themed-header"
            />
            <CardBody className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Supabase & Armazenamento Local Seguro
                    </p>
                    <p className="text-slate-500">
                      Sincronização com banco de dados Supabase e persistência local garantida sem perda de dados.
                    </p>
                  </div>
                </div>
                <Badge variant="emerald" size="sm">
                  Sincronizado
                </Badge>
              </div>

              {maintenanceFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{maintenanceFeedback}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    Manutenção & Integridade Referencial
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Remova registros órfãos de concursos/matérias excluídas ou zere apenas o histórico de sessões do concurso ativo.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={isSanitizing}
                    onClick={handleSanitizeOrphanData}
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-500" />}
                  >
                    🧹 Otimizar & Limpar Dados Órfãos
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsResetHistoryModalOpen(true)}
                    className="text-amber-600 dark:text-amber-400 hover:border-amber-400"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Resetar Histórico deste Concurso
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={logout}
              className="w-full sm:w-auto text-slate-600 dark:text-slate-300"
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sair da Conta
            </Button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            className="w-full sm:w-auto"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Salvar Alterações
          </Button>
        </div>
      </form>
        </>
      )}

      {activeSection === 'seguranca' && (
        <div className="space-y-6">
          {/* Quadro 1: Alterar senha */}
          <Card>
            <CardBody className="p-6 sm:p-8">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Alterar senha
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Depois de trocar, você segue conectado apenas neste dispositivo.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {passwordFeedback && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-2.5 ${
                      passwordFeedback.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {passwordFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span>{passwordFeedback.message}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                    Senha atual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-4 py-3 pr-10 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(prev => !prev)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                      Nova senha
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-4 py-3 pr-10 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(prev => !prev)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                      Confirmar nova senha
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-4 py-3 pr-10 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Widget de Autenticação Anti-Robô Cloudflare Turnstile */}
                <div className="pt-1">
                  <div className="min-h-[65px] flex items-center">
                    <Turnstile
                      ref={turnstileRef}
                      siteKey={turnstileSiteKey}
                      options={{
                        theme: isDarkMode ? 'dark' : 'light',
                      }}
                      onSuccess={(token) => setCaptchaToken(token)}
                      onExpire={() => setCaptchaToken(null)}
                      onError={() => setCaptchaToken(null)}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-6 py-2.5 rounded-full font-bold text-sm text-white bg-emerald-400 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-600 disabled:opacity-60 transition-all shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Alterar senha</span>
                  </button>
                </div>
              </form>
            </CardBody>
          </Card>

          {/* Quadro 2: Excluir Conta */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Excluir Conta"
              subtitle="Exclusão permanente da sua conta e de todos os dados associados"
              className="dashboard-themed-header"
            />
            <CardBody className="p-6 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  Encerrar e excluir minha conta permanentemente
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta ação é irreversível e apagará definitivamente todo o seu histórico de estudos, simulados, revisões e plano.
                </p>
              </div>
              <Button
                type="button"
                variant="danger"
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full sm:w-auto shrink-0 text-rose-600 hover:border-rose-400 dark:text-rose-400"
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Excluir Conta
              </Button>
            </CardBody>
          </Card>
        </div>
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Conta Permanentemente"
        description="Esta ação é irreversível e removerá todos os seus dados de estudo."
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>Todos os seus registros de estudo, simulados e plano serão apagados definitivamente.</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Tem certeza de que deseja prosseguir com a exclusão de sua conta?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteAccountConfirm}
            >
              Sim, Excluir Conta
            </Button>
          </div>
        </div>
      </Modal>

      <PrivacyPolicyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />

      <Modal
        isOpen={isResetHistoryModalOpen}
        onClose={() => setIsResetHistoryModalOpen(false)}
        title="Resetar Histórico deste Concurso"
        description="Esta ação apagará apenas as sessões de estudo e revisões vinculadas ao concurso ativo."
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span>
              As matérias e tópicos do seu Edital Verticalizado serão mantidos intactos, mas as horas estudadas e questões registradas neste concurso voltarão para zero.
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Deseja confirmar a limpeza do histórico de estudos do concurso ativo?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResetHistoryModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isResettingHistory}
              onClick={handleResetConcursoHistoryConfirm}
            >
              Sim, Resetar Histórico
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Alteração Real da Foto de Perfil (Câmera ou Galeria) */}
      <ProfilePhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onPhotoSelected={handlePhotoSelected}
      />
    </div>
  );
};
