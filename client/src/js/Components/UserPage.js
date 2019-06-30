import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import NavBar from './_Navbar.js';
import EventBar from './_Eventbar.js';
import Playlist from './_Playlist.js';
import Map from './_Map.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Button, Modal, Alert } from 'react-bootstrap';
import SpotifyWebApi from 'spotify-web-api-js';
const spotifyApi = new SpotifyWebApi();
const PexelsAPI = require('pexels-api-wrapper');
let pexelsClient = new PexelsAPI(process.env.REACT_APP_PEXELS_API_KEY);

// TODO: create a new playlist in Spotify when saving one

class User extends Component {
  constructor(props) {
    super(props);
    var start = moment();
    var end = moment().add(7, 'days');
    const { cookies } = this.props;
    const { city, region, latitude, longitude } = cookies.get(
      'jetify_location'
    );
    this.state = {
      current_user: {},
      current_playlist_id: '',
      display_city: city,
      display_region: region,
      map_city: '',
      map_state: '',
      display_lat: latitude,
      display_long: longitude,
      position: latitude.toString() + ',' + longitude.toString(),
      startDate: start.toDate(),
      endDate: end.toDate(),
      eventBarPosition: latitude.toString() + ',' + longitude.toString(),
      eventStartDate: start.toISOString(),
      eventEndDate: end.toISOString(),
      artists: [],
      tracksInPlaylist: true,
      playlistLoading: true,
      redirectToUserPage: false,
      redirectToHistoryPage: false,
      showDateForm: false,
      showSuccessAlert: false,
      trackList: []
    };
  }

  async componentDidMount() {
    //fetch user data from backend
    await this.fetchCurrentUser();
    await this.renderPlaylist();
  }

  componentDidUpdate(_, prevState) {
    //If artist state changes (on submit of new location) new playlist renders
    if (this.state.artists !== prevState.artists) {
      this.renderPlaylist();
    }
  }

  renderPlaylist = async () => {
    const { cookies } = this.props;
    const { current_user, trackList } = this.state;
    this.setState({
      tracksInPlaylist: true
    });

    spotifyApi.setAccessToken(cookies.get('jetify_token'));

    //fetch artistID for all artists in this.state.artist
    const artistIds = await this.fetchArtistIds();

    //fetch top songs for each artist in this.state.artists
    // Still need to return tracks to be async?? safety
    await this.fetchTopSongs(artistIds, 0, 3);

    if (current_user.reusable_spotify_playlist_id) {
      this.replaceSpotifyPlaylist(trackList);
    } else {
      this.createSpotifyPlaylist(trackList);
    }
  };

  replaceSpotifyPlaylist = async tracks => {
    const { current_user, map_city } = this.state;
    const playlistId = current_user.reusable_spotify_playlist_id;

    this.setState({ playlistLoading: true });

    await spotifyApi.changePlaylistDetails(playlistId, {
      name: `Jetify: ${map_city}`
    });
    await spotifyApi.replaceTracksInPlaylist(playlistId, tracks);

    if (!tracks.length) {
      this.setState({
        tracksInPlaylist: false,
        playlistLoading: false
      });
    } else {
      setTimeout(() => {
        this.setState({
          playlistLoading: false,
          current_playlist_id: playlistId
        });
      }, 1000);
    }
  };

  fetchCurrentUser = async () => {
    const { cookies } = this.props;
    const response = await axios.get(
      `/api/users/${cookies.get('jetify_user')}`
    );
    let user = response.data.user;
    this.setState({ current_user: user });
  };

  fetchArtistIds = async () => {
    const { artists } = this.state;
    let artistIds = [];

    const promises = artists.map(async artist => {
      try {
        const response = await spotifyApi.searchArtists(artist, 'artist');
        const responseArtist = response.artists.items[0];
        if (responseArtist) {
          artistIds.push(responseArtist.id);
        }
      } catch (err) {
        console.error(err);
      }
    });

    await Promise.all(promises);
    return artistIds;
  };

  fetchTopSongs = async (artistIds, firstSlice, secondSlice) => {
    let tracks = [];

    const promises = artistIds.map(async id => {
      try {
        const response = await spotifyApi.getArtistTopTracks(id, 'GB');
        const responseTracks = response.tracks.slice(firstSlice, secondSlice);
        responseTracks.forEach(track => tracks.push(track.uri));
      } catch (err) {
        console.error(err);
      }
    });

    await Promise.all(promises);
    this.setState({
      trackList: tracks
    });
  };

  createSpotifyPlaylist = tracks => {
    const { current_user, map_city } = this.state;
    this.setState({ playlistLoading: true });

    spotifyApi
      .createPlaylist(current_user.spotify_id, {
        name: `Jetify: ${map_city}`
      })
      .then(
        response => {
          if (!tracks.length) {
            this.setState({
              tracksInPlaylist: false,
              playlistLoading: false
            });
          } else {
            spotifyApi.addTracksToPlaylist(response.id, tracks).then(() => {
              axios
                .put(`/api/users/${current_user.id}`, {
                  reusable_spotify_playlist_id: response.id
                })
                .then(() => {
                  this.setState({
                    current_playlist_id: response.id,
                    playlistLoading: false
                  });
                });
            });
          }
        },
        err => {
          console.error(err);
        }
      );
  };

  renderRandomPlaylist = async () => {
    this.setState({
      tracksInPlaylist: true
    });
    //fetch artistID for all artists in this.state.artist
    const artistIds = await this.fetchArtistIds();

    //fetch top songs for each artist in this.state.artists
    const tracks = await this.fetchTopSongs(artistIds, 3, 6);

    //create playlist called 'Jetify' with artists top songs as tracks
    this.replaceSpotifyPlaylist(tracks);
  };

  //handle navbar buttons click after login
  handleLogout = () => {
    const { cookies } = this.props;
    cookies.remove('jetify_token', { path: '/' });
    cookies.remove('jetify_user', { path: '/' });
    cookies.remove('jetify_location', { path: '/' });
    this.setState({ current_user: null });
  };

  handleMyPlaylists = () => {
    this.setState({ redirectToHistoryPage: true });
  };

  savePlaylist = async () => {
    // set tracks in the state and call create new playlist with these tracks
    // const playlistId = current_user.reusable_spotify_playlist_id;
    const stringStart = this.state.startDate.toString();
    const stringEnd = this.state.endDate.toString();
    console.log('enddate', this.state.endDate);
    console.log('START', stringStart.slice(3, 10));
    console.log('END', stringEnd.slice(3, 15));

    const { trackList, current_playlist_id, map_city } = this.state;

    await this.createSpotifyPlaylist(trackList);

    let location = {
      name: this.state.map_city,
      latitude: this.state.display_lat,
      longitude: this.state.display_long
    };

    await spotifyApi.changePlaylistDetails(current_playlist_id, {
      name: `Jetify: ${map_city} - ${stringStart.slice(
        3,
        10
      )} to ${stringEnd.slice(3, 15)}`
    });

    //save location to db first, then playlist
    axios.post('/api/locations', location).then(response => {
      let locationID = response.data.location.id;
      let playlist = {
        user_id: this.state.current_user.id,
        location_id: locationID,
        name: `Jetify: ${this.state.map_city}`,
        spotify_id: this.state.current_playlist_id
      };
      axios
        .post(`/api/locations/${locationID}/playlists`, playlist)
        .then(response => {
          this.setState({ showSuccessAlert: true });
          console.log('------------------Saved playlist', response);
        });
    });
    //get thumbnail for each location
    pexelsClient
      .search(location.name, 1)
      .then(result => {
        let imageURL = result.photos[0].src.original;
        location.image = imageURL;
        console.log('Photos: ', imageURL);
      })
      .then(() => {
        //save location to db first, then playlist
        axios.post('/api/locations', location).then(response => {
          let locationID = response.data.location.id;
          let playlist = {
            user_id: this.state.current_user.id,
            location_id: locationID,
            name: `Jetify: ${this.state.map_city}`,
            spotify_id: this.state.current_playlist_id
          };
          axios
            .post(`/api/locations/${locationID}/playlists`, playlist)
            .then(response => {
              this.setState({ showSuccessAlert: true });
              console.log('------------------Saved playlist', response);
            });
        });
      });
  };

  makePositionString = () => {
    const position =
      this.state.display_lat.toString() +
      ',' +
      this.state.display_long.toString();
    return position;
  };

  setLocation = locationObj => {
    const lat = locationObj.mapPosition.lat;
    const lng = locationObj.mapPosition.lng;
    const area = locationObj.area;
    const state = locationObj.state;
    this.setState({
      display_lat: lat,
      display_long: lng,
      map_city: area,
      map_state: state
    });
    this.setState({
      position: this.makePositionString()
    });
  };

  setArtists = artistObj => {
    this.setState({
      artists: [...new Set(artistObj)]
    });
  };

  handleChangeStart = date => {
    this.setState({
      startDate: date
    });
  };

  handleChangeEnd = date => {
    this.setState({
      endDate: date
    });
  };

  onSubmit = () => {
    console.log(this.state.startDate.toISOString());
    this.setState({
      showDateForm: false,
      eventBarPosition: this.state.position,
      eventStartDate: this.state.startDate.toISOString(),
      eventEndDate: this.state.endDate.toISOString()
    });
  };

  //close form
  handleClose = () => {
    this.setState({ showDateForm: false });
  };

  //show form
  handleShow = () => {
    this.setState({ showDateForm: true });
  };

  //dismiss alert
  handleDismiss = () => {
    this.setState({ showSuccessAlert: false });
  };

  render() {
    const { cookies } = this.props;

    if (this.state.current_user === null) {
      return <Redirect to="/" />;
    }

    if (this.state.redirectToUserPage) {
      return <Redirect to={`/users/${cookies.get('jetify_user')}`} />;
    }

    if (this.state.redirectToHistoryPage) {
      return <Redirect to={`/users/${cookies.get('jetify_user')}/history`} />;
    }

    return (
      <div className="App">
        <NavBar
          user={this.state.current_user}
          city={this.state.display_city}
          region={this.state.display_region}
          handleLogout={this.handleLogout}
          handleMyPlaylists={this.handleMyPlaylists}
          cookies={this.props.cookies}
        />
        <div className="Body">
          <EventBar
            tracksInPlaylist={this.state.tracksInPlaylist}
            latlong={this.state.eventBarPosition}
            startDate={this.state.eventStartDate}
            endDate={this.state.eventEndDate}
            setArtists={this.setArtists}
          />
          <div className="map-container">
            <Map
              google={this.props.google}
              center={{
                lat: this.state.display_lat,
                lng: this.state.display_long
              }}
              display_city={this.state.display_city}
              height="80vh"
              zoom={2}
              setLocation={this.setLocation}
            />
            <Button className="popup-form-button" onClick={this.handleShow}>
              Select Dates To See Events In {this.state.map_city}
            </Button>
            <Modal
              show={this.state.showDateForm}
              onHide={this.handleClose}
              size="lg"
              aria-labelledby="contained-modal-title-vcenter"
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                  Whoop! Time to plan a trip to {this.state.map_city}{' '}
                  {this.state.map_state}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                Start Date&nbsp;&nbsp;
                <DatePicker
                  selected={this.state.startDate}
                  selectsStart
                  startDate={this.state.startDate}
                  endDate={this.state.endDate}
                  onChange={this.handleChangeStart}
                />
                &nbsp;&nbsp;&nbsp; End Date&nbsp;&nbsp;
                <DatePicker
                  selected={this.state.endDate}
                  selectsEnd
                  startDate={this.state.startDate}
                  endDate={this.state.endDate}
                  onChange={this.handleChangeEnd}
                  minDate={this.state.startDate}
                />
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={this.handleClose}>
                  Close
                </Button>
                <Button variant="primary" onClick={this.onSubmit}>
                  Submit
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
          <Playlist
            playlistLoading={this.state.playlistLoading}
            renderRandomPlaylist={this.renderRandomPlaylist}
            tracksInPlaylist={this.state.tracksInPlaylist}
            playlistID={this.state.current_playlist_id}
            savePlaylist={this.savePlaylist}
          />
          <Alert
            show={this.state.showSuccessAlert}
            variant="success"
            onClose={this.handleDismiss}
            dismissible
          >
            Playlist saved !{' '}
            <span role="img" aria-label="">
              💚
            </span>
          </Alert>
        </div>
      </div>
    );
  }
}

export default User;
