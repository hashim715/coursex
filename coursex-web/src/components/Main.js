/* eslint-disable no-unused-vars */
/* eslint-disable jsx-a11y/alt-text */
import "../App.css";
import feature_1 from "../assets/feature_1.png";
import feature_2 from "../assets/feature_2.png";
import feature_3 from "../assets/feature_3.png";
import college_1 from "../assets/college_1.png";
import college_2 from "../assets/college_2.png";
import college_3 from "../assets/college_3.png";
import college_4 from "../assets/college_4.png";
import college_5 from "../assets/college_5.png";
import theme from "../assets/theme.png";
import Carousel from "./Carousel";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Main = () => {
  const [userEmail, setUserEmail] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const navigate = useNavigate();
  const baseUrl ="https://backend.coursex.us";

  const slides = [
    { url: "https://assets.api.uizard.io/api/cdn/stream/9b4e18e2-7137-47d6-951f-3e1d73191c2d.png", title: "beach_0" },
    { url: "https://assets.api.uizard.io/api/cdn/stream/93d235af-59ad-4e71-b1b9-2831252ac235.png", title: "beach_1" },
    { url: "https://assets.api.uizard.io/api/cdn/stream/81af7516-1cbd-43c1-babe-fde7f51ba5d6.png", title: "beach_2" },
  ];

  const new_slides = [
    feature_1,
    feature_2,
    feature_3
  ]


  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(`${baseUrl}/api/webUser/create/`, {
        email: userEmail,
        schoolName: schoolName,
      });
      navigate("/thanks");
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  const pageChange = () => {
    navigate("/terms");
  };

  const pageChange2 = () => {
    navigate("/privacy");
  }

  return (
    <div className="Screen">
      <div className="top_div">
        <p className="heading">course<strong>x</strong></p>
      </div>
      <div className="upper_div">
        <div className="upper_div_left">
          <p className="tagline">
            The future of learning is <span style={{color:"#fff100"}}>collaborative.</span>
          </p>
          <p className="tagline_2">
            Chat. Plan. Study. With a little help from AI.
          </p>
          <div className="upper_div_left_bottom">
            <button className="button" onClick={() => (window.location.href = "https://apps.apple.com/us/app/coursex-a-better-groupme/id6739622543")}>
              Get the app
            </button>
            <button className="button_2" onClick={() => window.location.href = 'mailto:admin@coursex.us'}>
              Contact us
            </button>
          </div>
        </div>
        <div className="upper_div_right">
          {/* <div style={{display:"flex", width:"500px", justifyContent:"center"}}> */}
            <p className="trustedBy">Trusted by student groups at</p>
          {/* </div> */}
          <div className="collegeBox">
            <img src={college_1} className="MITLogo" />
            <img src={college_2} className="StanfordLogo" />
          </div>
          <div className="collegeBox">
            <img src={college_3} className="YaleLogo" />
            <img src={college_4} className="RiceLogo" />
          </div>      
            <img src={college_5} className="otherCollege" />
        </div>
      </div>
      <div className="middleDev">
        <div className="middleDevLeft">
          <p className="message">Say goodbye to your
          GroupMe, Quizlet, Chegg and ChatGPT <span style={{color:"#ff0004"}}>subscriptions</span></p>
        </div>
        <div className="middleDevRight">       
        <Carousel slides={new_slides} autoSlide={true} autoSlideInterval={2000} />        
        </div>
      </div>
      <p className="message_2">This is just a beginning.</p>
      <p className="message_3">Our team ships faster than the speed of light.</p>
      <img src={theme} className="theme" />
      <p className="message_4">Be the XAmbassador today. Apply now.</p>
      {/* <form onSubmit={handleSubmit}> */}
            <input
              className="inputBox"
              placeholder="Your school email address"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
            <input
              className="inputBox"
              placeholder="What school do you go to?"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
           
              <button className="submit" onClick={handleSubmit}>
                Submit
              </button>
            
      {/* </form> */}
      <div className="bottomDev">
        <div className="bottomLeft">
          <p className="coursex">© 2024 CourseX</p>
          <div className="bottomLeftInner">
            <p className="terms" onClick={pageChange}>
              Terms and Conditions
            </p>
            <p className="terms" onClick={pageChange2}>
              Privacy Policy
            </p>
          </div>
        </div>
        <div className="bottomRight">
          <p className="terms" onClick={pageChange}>
            Terms and Conditions
          </p>
          <p className="terms" onClick={pageChange2}>
            Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Main;
