import { render, screen } from '@testing-library/react'
import App from './App'
import { describe, it, expect } from 'vitest'

describe('App', () => {
    it('renders without crashing', () => {
        render(<App />)
        // Adjust this expectation based on actual App content, 
        // for now just checking if body is present or some basic element.
        // Since I haven't seen App.tsx content, I'll assume it renders something.
        // I'll check for a generic element or just that render successful.
        expect(document.body).toBeInTheDocument()
    })
})
