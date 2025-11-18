
import { useAuth } from '../context/AuthContext';

function ProfilePage(){
    const {user} = useAuth();
    //const navigate = useNavigate();    
    
    console.log("profilo");

    console.log(user.email);
    if(!user){
        return <div>Caricamento profilo</div>
    }else{
    return (
        <div>
            <h1>profilo di {user.email} </h1>
          
            
        </div>

     );
   
    }
     
}
export default ProfilePage