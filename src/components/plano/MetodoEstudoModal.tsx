import { useId, useState } from 'react';
import { CalendarDays, Repeat } from 'lucide-react';
import type { StudyMethod } from '../../types';
import { Modal } from '../../design-system/Modal';
import { Button } from '../../design-system/Button';

interface MetodoEstudoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMethod: StudyMethod;
  onSelectMethod: (method: StudyMethod) => Promise<void> | void;
  bannerUrl: string;
}

const METHOD_OPTIONS = [
  {
    id: 'ciclo',
    title: 'Ciclo de Estudos',
    description: 'Estude em sequência e retome de onde parou.',
    icon: Repeat,
  },
  {
    id: 'cronograma',
    title: 'Cronograma Fixo',
    description: 'Distribua as matérias em dias e horários da semana.',
    icon: CalendarDays,
  },
] as const;

export function MetodoEstudoModal({
  isOpen,
  onClose,
  currentMethod,
  onSelectMethod,
  bannerUrl,
}: MetodoEstudoModalProps) {
  const groupId = useId();
  const [selectedMethod, setSelectedMethod] = useState(currentMethod);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(false);
    try {
      await onSelectMethod(selectedMethod);
      onClose();
    } catch {
      setError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!isSubmitting) onClose(); }}
      title="Escolha seu método de estudo"
      description="Selecione como você quer organizar a sua rotina."
      maxWidth="3xl"
      panelClassName="rounded-3xl"
      sidePanel={(
        <div
          className="relative isolate flex min-h-28 flex-col justify-center overflow-hidden px-5 py-4 text-white sm:px-7 md:min-h-full md:justify-start md:py-7"
          style={{ background: 'linear-gradient(155deg, color-mix(in srgb, var(--primary-color) 37%, #071522), #071522)' }}
        >
          <img
            src={bannerUrl}
            alt=""
            className="pointer-events-none absolute inset-y-0 right-0 -z-10 h-full w-1/2 object-cover object-right [mask-image:linear-gradient(to_right,transparent,black_30%)] md:inset-x-0 md:bottom-0 md:top-auto md:h-[58%] md:w-full md:[mask-image:linear-gradient(to_bottom,transparent,black_27%)]"
          />
          <span className="text-sm font-bold sm:text-base">Gabarita</span>
          <p className="mt-1 max-w-[65%] text-xl font-extrabold leading-tight tracking-tight sm:text-2xl md:mt-7 md:max-w-none md:text-4xl">
            Planeje seus estudos
          </p>
        </div>
      )}
    >
      <form
        className="space-y-5"
        onSubmit={event => {
          event.preventDefault();
          void handleConfirm();
        }}
      >
        <fieldset className="space-y-3" disabled={isSubmitting}>
          <legend className="sr-only">Método de estudo</legend>
          {METHOD_OPTIONS.map(({ id, title, description, icon: Icon }) => {
            const selected = selectedMethod === id;
            return (
              <label
                key={id}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--primary-color)] sm:gap-4 sm:p-4 ${
                  selected
                    ? 'border-[var(--primary-color)] bg-[var(--primary-light)]'
                    : 'border-slate-300 hover:border-[var(--primary-color)] dark:border-slate-700'
                }`}
              >
                <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-12 ${
                  selected
                    ? 'bg-[var(--primary-light)] text-[var(--primary-text)] dark:text-[var(--primary-text-dark)]'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  <Icon className="size-5 sm:size-6" />
                </span>
                <span className="min-w-0 grow">
                  <span id={`${groupId}-${id}-title`} className="block text-sm font-extrabold text-slate-900 dark:text-slate-100 sm:text-base">{title}</span>
                  <span id={`${groupId}-${id}-description`} className="mt-1 block text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">{description}</span>
                </span>
                <input
                  type="radio"
                  name={groupId}
                  value={id}
                  checked={selected}
                  onChange={() => setSelectedMethod(id)}
                  aria-labelledby={`${groupId}-${id}-title`}
                  aria-describedby={`${groupId}-${id}-description`}
                  className="size-5 shrink-0 accent-[var(--primary-color)]"
                />
              </label>
            );
          })}
        </fieldset>

        <p className="text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
          Você pode replanejar seu método a qualquer momento.
        </p>
        {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">Não foi possível aplicar o método. Tente novamente.</p>}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button type="submit" isLoading={isSubmitting} className="font-bold">Confirmar método</Button>
        </div>
      </form>
    </Modal>
  );
}
