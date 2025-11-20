import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export function PublicRoute({children}){
    const {isAuthenticated }= useAuth();
    if(isAuthenticated){
        return <Navigate to="/profilo" replace/>
    }else{
        return children;
    }
}
