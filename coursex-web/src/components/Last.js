import { useNavigate } from "react-router-dom";

const styles = {
    Screen: {
      backgroundColor: 'black',
      width: '100vw',
      height: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      alignText: 'center',
      display: 'flex',
      flexDirection: 'column',
    },
    topCard: {
      width: '100vw',
      height: '10vh',
      backgroundColor: 'black',
      justifyContent: 'left',
    },
    bottomCard:{
        width: '100vw',
        height: '90vh',
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex',
    },
    Text: {
        color: 'white',
        fontSize: '1.5rem',
        fontFamily: 'Red Hat Display',
        fontWeight: 700,
        cursor:'pointer',
        marginLeft: '3vw',
        marginTop: '2vh',
      },
    Text_2:{
        color: 'white',
        fontSize: '2rem',
        fontFamily: 'Red Hat Display',
        fontWeight: 700,
        cursor:'pointer',
        alignText: 'center'
    },
    text_container:{
        display:'flex',
        alignText:'center',
        alignItems:'center',
        justifyContent:'center',
        width: '80vw',
    }
}

const Thanks = () => {

    const navigate = useNavigate();

    const pageChange = ()=>{
        navigate('/');
    }

    const message = "Thank you for being so supportive <33 We'll send you an email when the app is released.";


    return (
        <div style={styles.Screen}>

        <div style={styles.topCard}>
        
        <div style={styles.Text} onClick={()=> pageChange()}>home</div>

        </div>

        <div style={styles.bottomCard}>
        
        <div style={styles.text_container}>
        <div style={styles.Text_2}> {message}</div>
        </div>

        </div>

        </div>

    )

}

export default Thanks;


