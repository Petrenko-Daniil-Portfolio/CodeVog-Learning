import React from 'react'

import App from './App'

import { render, screen, fireEvent } from "@testing-library/react"

import '@testing-library/jest-dom/extend-expect'
import { BrowserRouter as Router } from 'react-router-dom';

test('App is rendered', () => {
    const component = render(<App />)
    const wrapper = component.getByTestId('app-wrapper')

    expect(wrapper).toBeInTheDocument();
})

test('Login link renders Sign In form', () => {
    const component = render(<App />)

    const login_link = component.getByText('Login')
    fireEvent.click(login_link)


})