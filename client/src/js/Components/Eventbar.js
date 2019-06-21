import React, { Component } from 'react';

class EventBar extends Component {
  render(){
    return (
      <div className="events-container">
        <section className="card" style={{width: 18 + "rem"}}>
          <img className="card-img-top" src="https://hecktictravels.com/wp-content/uploads/2012/02/NYC-Nightlife-THUMBNAIL.jpg" alt="Card image cap"/>
          <div className="card-body">
            <h5 className="card-title">Event 1</h5>
            <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
            <a href="#" className="btn btn-primary">Go somewhere</a>
          </div>
        </section>
        <section className="card" style={{width: 18 + "rem"}}>
          <img className="card-img-top" src="https://www.billboard.com/files/media/nyc-skyline-billboard-1548.jpg" alt="Card image cap"/>
          <div className="card-body">
            <h5 className="card-title">Event 2</h5>
            <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
            <a href="#" className="btn btn-primary">Go somewhere</a>
          </div>
        </section>
        <section className="card" style={{width: 18 + "rem"}}>
          <img className="card-img-top" src="https://victoryroadvgc.com/wp-content/uploads/2019/05/img_lugar_108_1522053167_kualalumpur.jpg" alt="Card image cap"/>
          <div className="card-body">
            <h5 className="card-title">Event 3</h5>
            <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
            <a href="#" className="btn btn-primary">Go somewhere</a>
          </div>
        </section>
        <section className="card" style={{width: 18 + "rem"}}>
          <img className="card-img-top" src="https://uploads.disquscdn.com/images/ad1339ef2da88b7701e51026ca5563a684daf85aeff0173d0d2f451853a76f9c.jpg" alt="Card image cap"/>
          <div className="card-body">
            <h5 className="card-title">Event 4</h5>
            <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
            <a href="#" className="btn btn-primary">Go somewhere</a>
          </div>
        </section>
      </div>
  );
  }
}

export default EventBar;
