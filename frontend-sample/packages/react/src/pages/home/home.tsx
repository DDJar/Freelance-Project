import React from "react";
import "./home.scss";
import HeroBanner from "../../components/library/hero-banner/HeroBanner";
import FeatureCards from "../../components/library/feature-card/FeatureCards";
import AboutUs from "../../components/library/about-us/AboutUs";
import { Services } from "../../components/library/services/Services";
import TeamSection from "../../components/library/team-section/TeamSection";
import Achievement from "../../components/library/achievement/Achievement";
import { Header } from "../../components/library/header/Header";
import Footer from "../../components/library/footer/Footer";
import { NewsPage } from "../news/news-page";
import FloatingContact from "../../components/library/floating-contact/FloatingContact";

export const Home = () => {

  return (
    <>
      <div >
        <Header />
        <HeroBanner />
        <FeatureCards />
        <AboutUs />
        <Services />
        {/* <TeamSection /> */}
        <Achievement />
        <NewsPage />
        <Footer />
        <FloatingContact />
      </div>
    </>
  );
};

export default Home;
