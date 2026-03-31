import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type Language = 'en' | 'ru'

const STORAGE_KEY = 'app-language'

function getInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'ru') return stored
  return 'en'
}

interface I18nContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const translations: Record<string, { en: string; ru: string }> = {
  // Common
  'loading': { en: 'Loading...', ru: 'Загрузка...' },
  'save': { en: 'Save', ru: 'Сохранить' },
  'cancel': { en: 'Cancel', ru: 'Отмена' },
  'confirm': { en: 'Confirm', ru: 'Подтвердить' },
  'delete': { en: 'Delete', ru: 'Удалить' },
  'back': { en: 'Back', ru: 'Назад' },
  'add': { en: 'Add', ru: 'Добавить' },
  'search': { en: 'Search...', ru: 'Поиск...' },
  'exercises': { en: 'exercises', ru: 'упражнений' },
  'sets': { en: 'sets', ru: 'подходов' },
  'kg': { en: 'kg', ru: 'кг' },
  'sec': { en: 'sec', ru: 'сек' },
  'custom': { en: 'Custom', ru: 'Своё' },
  'template': { en: 'Template', ru: 'Шаблон' },
  'more': { en: 'more', ru: 'ещё' },

  // App header / nav
  'app.title': { en: 'Workout Tracker', ru: 'Трекер Тренировок' },
  'nav.home': { en: 'Home', ru: 'Главная' },
  'nav.exercises': { en: 'Exercises', ru: 'Упражнения' },
  'nav.routines': { en: 'Routines', ru: 'Программы' },
  'nav.history': { en: 'History', ru: 'История' },
  'nav.progress': { en: 'Progress', ru: 'Прогресс' },
  'nav.signOut': { en: 'Sign out', ru: 'Выйти' },

  // Login
  'login.title': { en: 'Workout Tracker', ru: 'Трекер Тренировок' },
  'login.createAccount': { en: 'Create your account', ru: 'Создайте аккаунт' },
  'login.signInContinue': { en: 'Sign in to continue', ru: 'Войдите, чтобы продолжить' },
  'login.email': { en: 'Email', ru: 'Эл. почта' },
  'login.password': { en: 'Password', ru: 'Пароль' },
  'login.forgotPassword': { en: 'Forgot password?', ru: 'Забыли пароль?' },
  'login.signUp': { en: 'Sign Up', ru: 'Регистрация' },
  'login.signIn': { en: 'Sign In', ru: 'Войти' },
  'login.alreadyHaveAccount': { en: 'Already have an account?', ru: 'Уже есть аккаунт?' },
  'login.dontHaveAccount': { en: "Don't have an account?", ru: 'Нет аккаунта?' },
  'login.checkEmail': { en: 'Check your email', ru: 'Проверьте почту' },
  'login.confirmationSent': { en: 'We sent a confirmation link to', ru: 'Мы отправили ссылку для подтверждения на' },
  'login.clickToActivate': { en: 'Click the link in the email to activate your account.', ru: 'Нажмите на ссылку в письме, чтобы активировать аккаунт.' },
  'login.backToSignIn': { en: 'Back to Sign In', ru: 'Вернуться к входу' },
  'login.resetPassword': { en: 'Reset password', ru: 'Сброс пароля' },
  'login.resetDescription': { en: "Enter your email and we'll send you a reset link", ru: 'Введите email и мы отправим ссылку для сброса' },
  'login.enterEmail': { en: 'Please enter your email address', ru: 'Пожалуйста, введите email' },
  'login.sending': { en: 'Sending...', ru: 'Отправка...' },
  'login.sendResetLink': { en: 'Send Reset Link', ru: 'Отправить ссылку' },
  'login.resetSent': { en: 'We sent a password reset link to', ru: 'Мы отправили ссылку для сброса пароля на' },
  'login.clickToReset': { en: 'Click the link in the email to set a new password.', ru: 'Нажмите на ссылку в письме, чтобы задать новый пароль.' },

  // Reset password page
  'reset.title': { en: 'Set new password', ru: 'Новый пароль' },
  'reset.description': { en: 'Enter your new password below', ru: 'Введите новый пароль' },
  'reset.newPassword': { en: 'New password', ru: 'Новый пароль' },
  'reset.confirmPassword': { en: 'Confirm new password', ru: 'Подтвердите пароль' },
  'reset.mismatch': { en: 'Passwords do not match', ru: 'Пароли не совпадают' },
  'reset.updating': { en: 'Updating...', ru: 'Обновление...' },
  'reset.update': { en: 'Update Password', ru: 'Обновить пароль' },
  'reset.success': { en: 'Password updated', ru: 'Пароль обновлён' },
  'reset.successMessage': { en: 'Your password has been changed successfully.', ru: 'Ваш пароль успешно изменён.' },
  'reset.continue': { en: 'Continue to app', ru: 'Продолжить' },

  // Dashboard
  'dashboard.readyToTrain': { en: 'Ready to train', ru: 'Готовы к тренировке' },
  'dashboard.quickStart': { en: 'Quick Start', ru: 'Быстрый старт' },
  'dashboard.startWorkout': { en: 'Start Workout', ru: 'Начать тренировку' },
  'dashboard.pickRoutine': { en: 'Pick a routine and start training', ru: 'Выберите программу и начните' },
  'dashboard.chooseRoutine': { en: 'Choose routine', ru: 'Выбрать программу' },
  'dashboard.emptySession': { en: 'Empty session — add exercises as you go', ru: 'Пустая тренировка — добавляйте упражнения по ходу' },
  'dashboard.startEmpty': { en: 'Start empty', ru: 'Начать пустую' },
  'dashboard.exerciseLibrary': { en: 'Exercise Library', ru: 'Библиотека упражнений' },
  'dashboard.browseExercises': { en: 'Browse, search, and add exercises', ru: 'Просмотр и добавление упражнений' },
  'dashboard.browseExercisesBtn': { en: 'Browse exercises', ru: 'Открыть' },
  'dashboard.myRoutines': { en: 'My Routines', ru: 'Мои программы' },
  'dashboard.createManageRoutines': { en: 'Create and manage workout routines', ru: 'Создание и управление программами' },
  'dashboard.viewRoutines': { en: 'View routines', ru: 'Открыть' },
  'dashboard.history': { en: 'History', ru: 'История' },
  'dashboard.viewPastWorkouts': { en: 'View past workouts and repeat them', ru: 'Просмотр прошлых тренировок' },
  'dashboard.viewHistory': { en: 'View history', ru: 'Открыть' },
  'dashboard.progress': { en: 'Progress', ru: 'Прогресс' },
  'dashboard.chartsTrends': { en: 'Charts, trends, and personal bests', ru: 'Графики, тренды и личные рекорды' },
  'dashboard.viewProgress': { en: 'View progress', ru: 'Открыть' },
  'dashboard.chooseRoutineTitle': { en: 'Choose a Routine', ru: 'Выберите программу' },
  'dashboard.noRoutinesYet': { en: 'No routines yet. Create one first!', ru: 'Программ пока нет. Создайте первую!' },

  // Active Session
  'session.activeWorkout': { en: 'Active Workout', ru: 'Тренировка' },
  'session.unknown': { en: 'Unknown', ru: 'Неизвестно' },
  'session.set': { en: 'Set', ru: 'Подход' },
  'session.weight': { en: 'Weight', ru: 'Вес' },
  'session.reps': { en: 'Reps', ru: 'Повторения' },
  'session.rest': { en: 'Rest', ru: 'Отдых' },
  'session.addSet': { en: 'Add Set', ru: 'Добавить подход' },
  'session.addExercise': { en: 'Add Exercise', ru: 'Добавить упражнение' },
  'session.searchExercises': { en: 'Search...', ru: 'Поиск...' },
  'session.finishWorkout': { en: 'Finish Workout', ru: 'Завершить тренировку' },
  'session.finishing': { en: 'Finishing...', ru: 'Завершение...' },

  // Exercises page
  'exercises.title': { en: 'Exercise Library', ru: 'Библиотека упражнений' },
  'exercises.addExercise': { en: 'Add Exercise', ru: 'Добавить' },
  'exercises.searchPlaceholder': { en: 'Search exercises...', ru: 'Поиск упражнений...' },
  'exercises.all': { en: 'All', ru: 'Все' },
  'exercises.chest': { en: 'Chest', ru: 'Грудь' },
  'exercises.back': { en: 'Back', ru: 'Спина' },
  'exercises.legs': { en: 'Legs', ru: 'Ноги' },
  'exercises.shoulders': { en: 'Shoulders', ru: 'Плечи' },
  'exercises.arms': { en: 'Arms', ru: 'Руки' },
  'exercises.core': { en: 'Core', ru: 'Пресс' },
  'exercises.noFound': { en: 'No exercises found', ru: 'Упражнения не найдены' },
  'exercises.tryAdjusting': { en: 'Try adjusting your search or filters', ru: 'Попробуйте изменить поиск или фильтры' },
  'exercises.addCustom': { en: 'Add Custom Exercise', ru: 'Добавить своё упражнение' },
  'exercises.name': { en: 'Name', ru: 'Название' },
  'exercises.description': { en: 'Description', ru: 'Описание' },
  'exercises.muscleGroup': { en: 'Muscle Group', ru: 'Группа мышц' },
  'exercises.tags': { en: 'Tags (comma separated)', ru: 'Теги (через запятую)' },
  'exercises.tagsPlaceholder': { en: 'barbell, compound', ru: 'штанга, базовое' },
  'exercises.create': { en: 'Create Exercise', ru: 'Создать' },

  // Routines page
  'routines.title': { en: 'My Routines', ru: 'Мои программы' },
  'routines.customCount': { en: 'custom', ru: 'своих' },
  'routines.templates': { en: 'templates', ru: 'шаблонов' },
  'routines.newRoutine': { en: 'New Routine', ru: 'Новая программа' },
  'routines.noRoutines': { en: 'No routines yet', ru: 'Программ пока нет' },
  'routines.createOrTemplate': { en: 'Create one or use a template below', ru: 'Создайте свою или используйте шаблон' },
  'routines.templatesTitle': { en: 'Templates', ru: 'Шаблоны' },

  // Routine Builder
  'builder.useTemplate': { en: 'Use Template', ru: 'Использовать шаблон' },
  'builder.editRoutine': { en: 'Edit Routine', ru: 'Редактировать программу' },
  'builder.newRoutine': { en: 'New Routine', ru: 'Новая программа' },
  'builder.routineName': { en: 'Routine Name', ru: 'Название программы' },
  'builder.namePlaceholder': { en: 'e.g. Monday Push Day', ru: 'напр. Понедельник — жим' },
  'builder.exercisesCount': { en: 'Exercises', ru: 'Упражнения' },
  'builder.addExercise': { en: 'Add Exercise', ru: 'Добавить упражнение' },
  'builder.searchExercises': { en: 'Search...', ru: 'Поиск...' },
  'builder.addExercisesPrompt': { en: 'Add exercises to build your routine', ru: 'Добавьте упражнения для программы' },
  'builder.setsLabel': { en: 'Sets', ru: 'Подходы' },
  'builder.repsLabel': { en: 'Reps', ru: 'Повторения' },
  'builder.saving': { en: 'Saving...', ru: 'Сохранение...' },
  'builder.updateRoutine': { en: 'Update Routine', ru: 'Обновить программу' },
  'builder.createRoutine': { en: 'Create Routine', ru: 'Создать программу' },

  // History page
  'history.title': { en: 'Workout History', ru: 'История тренировок' },
  'history.completedWorkout': { en: 'completed workout', ru: 'завершённая тренировка' },
  'history.workouts': { en: 'workouts', ru: 'тренировок' },
  'history.noWorkouts': { en: 'No completed workouts yet. Finish a session to see it here.', ru: 'Завершённых тренировок пока нет. Завершите тренировку, чтобы увидеть её здесь.' },
  'history.noSetsLogged': { en: 'No sets logged', ru: 'Подходы не записаны' },
  'history.repeatWorkout': { en: 'Repeat This Workout', ru: 'Повторить тренировку' },
  'history.starting': { en: 'Starting...', ru: 'Запуск...' },
  'history.deleteConfirm': { en: 'Delete this workout from history?', ru: 'Удалить тренировку из истории?' },

  // Progress page
  'progress.title': { en: 'Progress', ru: 'Прогресс' },
  'progress.subtitle': { en: 'Track your training over time', ru: 'Отслеживайте прогресс тренировок' },
  'progress.thisWeek': { en: 'This Week', ru: 'Эта неделя' },
  'progress.thisMonth': { en: 'This Month', ru: 'Этот месяц' },
  'progress.totalSessions': { en: 'Total Sessions', ru: 'Всего тренировок' },
  'progress.totalVolume': { en: 'Total Volume', ru: 'Общий объём' },
  'progress.tonnes': { en: 't', ru: 'т' },
  'progress.workoutsPerWeek': { en: 'Workouts per Week', ru: 'Тренировок в неделю' },
  'progress.workouts': { en: 'Workouts', ru: 'Тренировки' },
  'progress.exerciseTrend': { en: 'Exercise Trend', ru: 'Тренд упражнения' },
  'progress.selectExercise': { en: 'Select exercise', ru: 'Выберите упражнение' },
  'progress.noDataExercise': { en: 'No data yet for this exercise', ru: 'Данных пока нет' },
  'progress.selectToSeeTrends': { en: 'Select an exercise to see trends', ru: 'Выберите упражнение для просмотра трендов' },
  'progress.personalBests': { en: 'Personal Bests', ru: 'Личные рекорды' },
  'progress.volume': { en: 'Volume', ru: 'Объём' },
  'progress.maxWeight': { en: 'Max Weight (kg)', ru: 'Макс. вес (кг)' },
  'progress.completeToSee': { en: 'Complete some workouts to see your progress here.', ru: 'Завершите несколько тренировок, чтобы увидеть прогресс.' },

  // AI Sidebar
  'ai.greeting': { en: "Hey! How's your day going? I'm your workout assistant — I can create sessions, look up your history, or help plan your next workout. What can I do for you?", ru: 'Привет! Я ваш тренировочный ассистент — могу создать тренировку, посмотреть историю или помочь спланировать следующую. Чем могу помочь?' },
  'ai.title': { en: 'AI Assistant', ru: 'AI Ассистент' },
  'ai.clearHistory': { en: 'Clear chat history', ru: 'Очистить историю чата' },
  'ai.features': { en: 'AI Features', ru: 'AI Функции' },
  'ai.active': { en: 'AI assistant is active', ru: 'AI ассистент включён' },
  'ai.disabled': { en: 'AI assistant is disabled', ru: 'AI ассистент выключен' },
  'ai.isDisabled': { en: 'AI is disabled. Enable it in settings above.', ru: 'AI выключен. Включите в настройках выше.' },
  'ai.placeholder': { en: 'Ask about your workouts...', ru: 'Спросите о тренировках...' },
  'ai.thinking': { en: 'Thinking...', ru: 'Думаю...' },
  'ai.suggestion1': { en: 'Create a push day workout', ru: 'Создай тренировку на жим' },
  'ai.suggestion2': { en: 'Start a leg session with squats', ru: 'Начни тренировку ног с приседаниями' },
  'ai.suggestion3': { en: 'What did I do last workout?', ru: 'Что было на прошлой тренировке?' },
  'ai.confirmRequired': { en: 'Confirmation required', ru: 'Требуется подтверждение' },
  'ai.thisWill': { en: 'This will', ru: 'Действие:' },
  'ai.confirm': { en: 'Confirm', ru: 'Подтвердить' },
  'ai.cancel': { en: 'Cancel', ru: 'Отмена' },
  'ai.chatDescription': { en: 'Chat with your workout AI assistant', ru: 'Чат с AI ассистентом по тренировкам' },
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLanguage)

  const setLang = useCallback((l: Language) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }, [])

  const t = useCallback(
    (key: string): string => {
      const entry = translations[key]
      if (!entry) return key
      return entry[lang]
    },
    [lang]
  )

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider')
  return ctx
}
