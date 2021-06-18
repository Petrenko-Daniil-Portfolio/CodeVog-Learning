import React from 'react'
import Navbar from './Navbar'

import { render, screen, fireEvent } from "@testing-library/react"

import '@testing-library/jest-dom/extend-expect'
import { BrowserRouter as Router } from 'react-router-dom';



test("navbar renders with login", () => {
    const component = render( <Router> <Navbar /> </Router>);
    const login = component.getByTestId("Login")

    expect(login.textContent).toBe("Login")
})


//    test('navbar login link click', () => {
//        const component = render( <Router> <Navbar /> </Router>);
//        const login_link = component.getByTestId("Login")
//        screen.debug();
//
//        fireEvent.click(login_link)
//    })

