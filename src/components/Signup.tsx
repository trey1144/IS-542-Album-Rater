import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signUpNewUser } = UserAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signUpNewUser(email, password);

      if (result.success) {
        navigate("/");
      } else {
        setError(result.error ?? "An error occurred during sign up. Please try again.");
      }
    } catch (error) {
      setError("An error occurred during sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSignUp} className="signup-form form-panel">
        <div className="form-group">
          <h2>Sign up today!</h2>
          <p>
            Already have an account? <Link to="/signin">Sign in!</Link>
          </p>
          <label htmlFor="email">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control"
            id="email"
            placeholder="Enter email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
            id="password"
            placeholder="Enter password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn primary-action button-pill w-100"
        >
          Sign Up
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};

export default Signup;
