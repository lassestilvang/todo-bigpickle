# Task Planner

A modern, professional daily task planner built with Next.js 16, TypeScript, and Tailwind CSS.

## Features

### Core Functionality
- **Task Management**: Create, edit, delete, and complete tasks
- **Lists**: Organize tasks into custom lists with colors and emojis
- **Labels**: Tag tasks with colored labels and icons
- **Subtasks**: Break down tasks into smaller, manageable items
- **Priority Levels**: Set task priority (High, Medium, Low, None)
- **Due Dates & Deadlines**: Schedule tasks with dates and deadlines
- **Time Tracking**: Estimate and track actual time spent on tasks
- **Recurring Tasks**: Set up daily, weekly, monthly, or custom recurring tasks
- **Task History**: Track all changes made to tasks

### Views
- **Today**: View tasks scheduled for today
- **Next 7 Days**: See tasks for the upcoming week
- **Upcoming**: All future tasks
- **All**: Complete task overview
- **List Views**: Filter by specific lists

### User Interface
- **Modern Design**: Clean, minimalistic interface with dark mode support
- **Responsive**: Works seamlessly on desktop and mobile devices
- **Search**: Fast fuzzy search across all tasks
- **Animations**: Smooth transitions and micro-interactions
- **Theme Support**: Light, dark, and system themes

### Technical Features
- **TypeScript**: Full type safety throughout the application
- **Local Storage**: SQLite database for offline functionality
- **State Management**: Zustand for efficient state handling
- **Form Validation**: Comprehensive input validation with error handling
- **Testing**: Full test coverage with Jest and React Testing Library

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **State Management**: Zustand
- **Database**: SQLite with better-sqlite3
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **Search**: Fuse.js for fuzzy search
- **Testing**: Jest with React Testing Library
- **Package Manager**: Bun

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd todo-bigpickle
```

2. Install dependencies:
```bash
bun install
```

3. Run the development server:
```bash
bun run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run test` - Run tests
- `bun run test:watch` - Run tests in watch mode
- `bun run test:coverage` - Run tests with coverage report

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── app-sidebar.tsx   # Main sidebar
│   ├── task-card.tsx     # Task card component
│   ├── task-form.tsx     # Task creation/editing form
│   ├── task-list.tsx     # Task list view
│   ├── theme-provider.tsx # Theme context
│   └── theme-toggle.tsx  # Theme switcher
├── lib/                  # Utility libraries
│   ├── database.ts       # Database service
│   ├── seed.ts          # Sample data generation
│   └── utils.ts         # Utility functions
├── store/               # Zustand store
│   └── index.ts         # Main store configuration
├── types/               # TypeScript type definitions
│   └── index.ts         # Core types
└── hooks/               # Custom React hooks
```

## Database Schema

The application uses SQLite with the following main tables:

- **lists**: Task lists (Inbox, custom lists)
- **labels**: Task labels with colors and icons
- **tasks**: Main task records
- **subtasks**: Task subtasks
- **task_history**: Change tracking
- **task_labels**: Many-to-many relationship between tasks and labels
- **reminders**: Task reminders
- **attachments**: File attachments

## Features in Detail

### Task Management
- Create tasks with name, description, due date, priority, and labels
- Add subtasks for complex projects
- Set time estimates and track actual time
- Configure recurring tasks with flexible patterns
- Attach files and set reminders

### Organization
- Custom lists with colors and emoji icons
- Label system for categorization
- Multiple view options for different workflows
- Search and filter capabilities

### User Experience
- Clean, modern interface with smooth animations
- Dark/light theme support
- Responsive design for all devices
- Keyboard shortcuts and accessibility features
- Real-time updates and feedback

## Testing

The application includes comprehensive tests:

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Generate coverage report
bun run test:coverage
```

Test coverage includes:
- Component testing (React Testing Library)
- Store/state management testing
- Database operations testing
- Form validation testing

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Database by [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
