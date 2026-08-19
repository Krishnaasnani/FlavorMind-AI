import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";
import Login from "./Login";
import SignUp from "./SignUp";
import { getCurrentUser, signInAccount, signOutAccount, signUpAccount } from "../services/auth";

jest.mock("../services/auth", () => ({
  getCurrentUser: jest.fn(),
  signInAccount: jest.fn(),
  signOutAccount: jest.fn(),
  signUpAccount: jest.fn()
}));

function renderAuth(page, initialEntry = "/") {
  return render(<AuthProvider><MemoryRouter initialEntries={[initialEntry]}>{page}</MemoryRouter></AuthProvider>);
}

beforeEach(() => {
  jest.clearAllMocks();
  getCurrentUser.mockResolvedValue({ user: null });
  signOutAccount.mockResolvedValue({ ok: true });
});

test("validates matching signup passwords", async () => {
  renderAuth(<SignUp />);
  await screen.findByRole("heading", { name: /create your kitchen account/i });
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ada" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
  fireEvent.change(screen.getByLabelText("Password", { selector: "input" }), { target: { value: "password123" } });
  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "different123" } });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Passwords do not match");
  expect(signUpAccount).not.toHaveBeenCalled();
});

test("logs in successfully and reports login errors", async () => {
  signInAccount.mockResolvedValue({ user: { id: "1", name: "Ada", email: "ada@example.com" } });
  renderAuth(<Routes><Route path="/login" element={<Login />} /><Route path="/" element={<p>Home</p>} /></Routes>, "/login");
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByText("Home")).toBeInTheDocument();

  cleanup();
  signInAccount.mockRejectedValueOnce(new Error("Email or password is incorrect."));
  renderAuth(<Login />);
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "bad@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect");
});

test("restores a session and protects personal routes when signed out", async () => {
  getCurrentUser.mockResolvedValueOnce({ user: { id: "1", name: "Ada", email: "ada@example.com" } });
  renderAuth(<p data-testid="account">Account</p>);
  expect(await screen.findByTestId("account")).toBeInTheDocument();

  getCurrentUser.mockResolvedValueOnce({ user: null });
  renderAuth(<Routes><Route path="/favorites" element={<ProtectedRoute><p>Favorites</p></ProtectedRoute>} /><Route path="/login" element={<p>Sign in</p>} /></Routes>, "/favorites");
  await waitFor(() => expect(screen.getByText("Sign in")).toBeInTheDocument());
});
