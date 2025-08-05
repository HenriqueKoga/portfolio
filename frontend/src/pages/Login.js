import React from 'react';

const Login = () => {
  const handleLogin = (provider) => {
    window.location.href = `http://localhost/api/login/${provider}`;
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center">Login</h2>
              <div className="d-grid gap-2">
                <button className="btn btn-danger" onClick={() => handleLogin('google')}>Login with Google</button>
                <button className="btn btn-dark" onClick={() => handleLogin('github')}>Login with GitHub</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
