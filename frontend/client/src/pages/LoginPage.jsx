//pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService} from '../services/api';
import { useAuth } from '../context/AuthContext';


function LoginPage(){
    const [email, setEmail]= useState('');
    const [password,setPassword] = useState('');

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const navigate = useNavigate();    
    const authTools = useAuth();

    const handleSubmit = async (event) => {
            event.preventDefault();
            setError(null);
            setSuccess(null);
            try {
                const loginData= {
                    email,
                    password,
                };
                const response = await authService.login(loginData);
                const userData = response.data.data; 
                authTools.setUser(userData);              
                setSuccess('Login effettuato correttamente!!.');
                navigate('/');
            }catch(err){
                console.error('Errore durante il login: ', err.response.data);
                setError(err.response.data.message || 'si è verificato un errore');
            }
    };
    return (
        <div>
            <h1>Effettua il login</h1>
            <form onSubmit = {handleSubmit}>
            
                <div>
                    <label>Email</label>
                    <input
                    type= "email"
                    value = {email}
                    onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label>Password</label>
                    <input 
                    type = "Password"
                    value = {password}
                    onChange= {(e)=> setPassword(e.target.value)}
                    />
                </div>
                
                <button type = "submit">Accedi </button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}  

           
        </div>
    );
}


export default LoginPage  