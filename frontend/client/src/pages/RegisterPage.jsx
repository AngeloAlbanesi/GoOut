
//pages/RegisterPage.jsx
import React, { useState } from 'react';
import { authService } from '../services/api';

function RegisterPage(){
    const [username, setUsername] = useState('');
    const [email, setEmail]= useState('');
    const [password,setPassword] = useState('');
    const [dateOfBirth, setDateOfBirth]= useState('');

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            const userData= {
                username,
                email,
                password,
                dateOfBirth,
            };
            const response = await authService.register(userData);
            console.log('Risposta dal server:', response.data);
            setSuccess('Registrazione avvenuta con successo! Ora puoi fare il login.');
        }catch(err){
            console.error('errore durante la registrazione: ', err.response.data);
            setError(err.response.data.message || 'si è verificato un errore');
        }

        
    };

    return (
        <div>
            <h1>Registrati</h1>
            <form onSubmit = {handleSubmit}>
                <div>
                    <label> Username:</label>
                    <input 
                    type= "text"
                    value={username}
                    onChange= {(e) => setUsername(e.target.value) }
                    />
                </div>
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
                <div>
                    <label>Data di Nascita</label>
                    <input
                    type = "date"
                    value= {dateOfBirth}
                    onChange={(e)=> setDateOfBirth(e.target.value)}
                    />
                </div>
                <button type = "submit">Registrati </button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}  
        </div>
    );
}

export default RegisterPage