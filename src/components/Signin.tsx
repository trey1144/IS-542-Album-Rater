import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signInUser, session } = UserAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signInUser(email, password);

      if (result.success) {
        navigate("/");
      } else {
        setError(result.error ?? "An error occurred during sign in. Please try again.");
      }
    } catch (error) {
      setError("An error occurred during sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSignIn} className="signup-form form-panel">
        <div className="form-group">
          <h2>Sign in</h2>
          <p>
            Don't have an account? <Link to="/signup">Sign up!</Link>
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
          Sign In
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};

export default Signin;
