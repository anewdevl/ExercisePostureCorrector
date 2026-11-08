import { useEffect } from "react"
import { Link } from "react-router-dom"
import "./css/styles.css" // Import your CSS file
import heroImage from "./img/athlete-cutout.png" // Import the hero image
import AOS from "aos"
import "aos/dist/aos.css"

const Home = () => {
  useEffect(() => {
    AOS.init({
      offset: 1,
    })
  }, [])

  return (
    <>
      <section className="hero" data-aos="zoom-in" data-aos-duration="1400">
        <div className="hero-text">
          <h5 data-aos="fade-right" data-aos-duration="1400">
            PLAN. TRAIN. PROGRESS.
          </h5>
          <h1
            data-aos="zoom-in-left"
            data-aos-duration="1400"
            data-aos-delay="200"
          >
            Train smarter. Move better.
          </h1>
          <p
            data-aos="fade-right"
            data-aos-duration="1400"
            data-aos-delay="300"
          >
            AI-powered workout planning and camera-based exercise tracking.
            Build your routine, follow your movement, and keep track of your sessions.
          </p>
          <div
            className="main-hero"
            data-aos="flip-down"
            data-aos-duration="1400"
            data-aos-delay="400"
          >
            <Link to="/generate" className="btn">
              Create a workout
            </Link>
            <Link to="/train" className="btn camera-cta">
              Train with camera
            </Link>
            <Link to="/chat" className="hero-chat">
              Have a question? Chat with your fitness assistant →
            </Link>
          </div>
        </div>
        <div className="hero-cutout"><img src={heroImage} alt="Athlete in workout clothes holding two dumbbells" /></div>
      </section>

      <div className="icons">
        <a
          href="#"
          data-aos="fade-in"
          data-aos-duration="1400"
          data-aos-delay="600"
        >
          <i className="ri-facebook-fill"></i>
        </a>
        <a
          href="#"
          data-aos="fade-in"
          data-aos-duration="1400"
          data-aos-delay="700"
        >
          <i className="ri-youtube-fill"></i>
        </a>
        <a
          href="#"
          data-aos="fade-in"
          data-aos-duration="1400"
          data-aos-delay="800"
        >
          <i className="ri-twitter-fill"></i>
        </a>
      </div>

      <div
        className="scroll"
        data-aos="zoom-out-down"
        data-aos-duration="1400"
        data-aos-delay="550"
      >
        <a href="#">
          <i className="ri-scroll-to-bottom-line"></i>Scroll Down
        </a>
      </div>
    </>
  )
}

export default Home
