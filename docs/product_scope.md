# Workout Tracker - Product Scope (v1)

## 1. Product Purpose

Workout Tracker is a simple personal web app for planning workouts, logging sessions, and tracking progress over time.

The product focuses on:
- Fast workout logging
- Clear session history
- Easy routine creation from a built-in exercise library
- Optional AI assistance (can be turned off at any time)

## 2. Target User

- Individual users training for personal goals (strength, muscle gain, fitness, consistency)
- Users who prefer a simple, low-friction workflow

## 3. Product Principles

- Keep it simple and fast
- Minimize clicks during training
- Make core actions obvious (start, log, finish, review)
- Keep AI optional and non-blocking
- Ensure comfortable mobile usage

## 4. Core Functional Scope

### 4.1 User Authentication

- Sign up with personal account
- Log in and log out securely
- Access only personal routines, sessions, and history

### 4.2 Exercise Library (Database of Exercises)

- Central catalog of exercises
- Each exercise contains:
  - Name
  - Short description/instructions
  - Primary muscle group
  - Optional category tags (for example, equipment type)
- Search and filter exercises
- Select exercises from this library when building routines or custom sessions

### 4.3 Predefined Standard Routines

The app includes default templates such as:
- Push / Pull / Legs
- Full Body
- Upper / Lower split

User can:
- Open and use template as-is
- Duplicate and modify template

### 4.4 Custom Routine Builder

- Create a new routine manually
- Add exercises from the exercise library
- Reorder exercises
- Define planned set/rep targets
- Save routine for future use

### 4.5 Custom Workout Session (Ad-hoc)

- Start a workout without a saved routine
- Add exercises on the fly from the library
- Edit session content while training
- Save completed session to history

### 4.6 Workout Logging

During a session, user can log:
- Sets
- Reps
- Weight/load
- Optional notes

When finished:
- Session is marked complete and stored in history

### 4.7 Workout History

- View all past sessions in chronological order
- Open any session to see full details
- Reuse a past session as a quick starting point

### 4.8 Basic Progress Tracking

- Total workouts per week/month
- Exercise-level trend view (weight/reps over time)
- Personal best values (optional but recommended in v1)

### 4.9 AI Chat Sidebar (Optional)

AI assistant is available in a sidebar and can:
- Create workout sessions
- Edit workout sessions
- Delete workout sessions (with confirmation)

Behavior rules:
- Show a clear summary after each action
- Ask a clarification question if the request is ambiguous
- Operate only on the current user's data

### 4.10 AI Toggle (On/Off)

- User can turn AI Assistant on or off
- When Off:
  - AI sidebar is hidden
  - AI entry points are not shown
- When On:
  - AI sidebar becomes available again
- AI on/off preference is saved per user
- Core app features work fully without AI

### 4.11 Mobile-Friendly Experience

The web app must be comfortable on phones:
- Responsive layouts for small screens
- Large, touch-friendly controls
- Fast access to core actions (start, log, finish)
- Readable typography and spacing
- History and logging views optimized for vertical scrolling
- AI sidebar on mobile opens as a panel/drawer; when AI is off, it is fully hidden

## 5. Primary User Flows

1. User signs up or logs in
2. User chooses one of:
   - Start from standard routine
   - Build custom routine
   - Start custom ad-hoc session
3. User logs exercises during workout
4. User completes session
5. Session appears in history and contributes to progress metrics
6. Optional: user uses AI sidebar to create/edit/delete sessions

## 6. Out of Scope for v1

- Social feed, likes, comments, and competition features
- Wearable integrations
- Advanced coaching automation and complex recommendations
- Multi-user coaching/trainer portals

## 7. Functional Acceptance Criteria (v1)

- User authentication works end-to-end
- Exercise library is available and usable in routine/session creation
- User can use predefined templates and create custom routines
- User can start, log, and complete custom or routine-based sessions
- Every completed session appears in history
- Basic progress data is visible
- AI can create/edit/delete sessions when enabled
- AI can be turned off, and the app remains fully usable
- Main workflows are usable on mobile screens
