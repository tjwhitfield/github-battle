var axios = require('axios');

var id = "bfd4d7874b341e91c5af";
var sec = "b60990eabfce3edda125589b9b700165c796f220";
var params = "?client_id=" + id + "&client_secret=" + sec;

//https://api.github.com/users/tjwhitfield?client_id=bfd4d7874b341e91c5af&client_secret=b60990eabfce3edda125589b9b700165c796f220

function getProfile(username) {
  return axios.get('https://api.github.com/users/' + username + params)
    .then(function(user) {
      return user.data;
    });
}

function getRepos(username) {
  return axios.get('https://api.github.com/users/' + username + '/repos'
    + params + '&per_page=100');
}

function getStarCount(repos) {
  return repos.data.reduce(function(count, repo) {
    return count + repo.stargazers_count;
  }, 0)
}

function calculateScore(profile, repos) {
  var followers = profile.followers;
  var totalStars = getStarCount(repos);
  return (followers * 3) + totalStars;
}

function handleError(error) {
  console.warn(error);
  return null;
}

function getUserData(player) {
  // wait for all promises (in array) to be fulfilled, then...
  // the "then" function can access the promises' return values as elements in a "data" array
  // getProfile and getRepos are both async (with promises), so insert them both into array
  // we do all this async stuff because this external (github) API is async
  return axios.all([
    getProfile(player),
    getRepos(player)
  ]).then(function(data) {
    var profile = data[0];
    var repos = data[1];
    return {
      profile: profile,
      score: calculateScore(profile, repos)
    };
  });
}

function sortPlayers(players) {
  // every array has sort function that returns a new array
  // sort by a function that compares a and b, putting the larger one first
  return players.sort(function(a, b) {
    return b.score - a.score;
  });
}

module.exports = {
  battle: function(players) {
    // return a promise that, when resolved, we'll have all the players' user data
    return axios.all(players.map(getUserData))
      .then(sortPlayers)
      .catch(handleError);
  },
  fetchPopularRepos: function(language) {
    var encodedURI = window.encodeURI(
      'https://api.github.com/search/repositories?q=stars:>1+language:' +
      language +
      '&sort=stars&order=desc&type=Repositories'
    );
    return axios.get(encodedURI)
      .then(function(response) {
        return response.data.items;
      });
  }
}
