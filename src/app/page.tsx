import type { Metadata } from 'next'
import HomeClient from './home-client'

export const metadata: Metadata = {
  title: 'Todo App',
  description: 'A modern todo application built with Next.js',
}

export default function HomePage() {
  return <HomeClient />
}
