import { describe, expect, it } from 'bun:test'
import { render } from '@testing-library/react'
import { Celebration } from '@/components/celebration'

describe('Celebration', () => {
  it('should render nothing when inactive', () => {
    const { container } = render(<Celebration active={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('should render particles when active', () => {
    const { container } = render(<Celebration active={true} />)
    expect(container.innerHTML).not.toBe('')
  })
})
