const clientId = "e77e563e6765445c98400077670ae665"; // Replace with your client ID
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

try {
    if (!code) {
        redirectToAuthCodeFlow(clientId);
    } else {
        const accessToken = await getAccessToken(clientId);
        console.log(accessToken);
        const songinfo = await fetchCurrentSong(accessToken);
        console.log(songinfo);
        populateUI(songinfo);
    }
}
catch (e) {
    console.log(e);
}

export async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    console.log(verifier);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "https://currently-playing.github.io/");
    params.append("scope", "user-read-currently-playing");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    const values = crypto.getRandomValues(new Uint8Array(length));

    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

async function generateCodeChallenge(codeVerifier) {
    // hash verifier using SHA256 algorithm
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);

    // end value outputted into digest
    const digest = await window.crypto.subtle.digest('SHA-256', data);


    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

export async function getAccessToken(clientId) {
    const verifier = localStorage.getItem("verifier");

    // get access code from url after user authorizes application
    const params = new URLSearchParams(window.location.search);
    let code = params.get('code');

    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "https://currently-playing.github.io/");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

async function fetchCurrentSong(token) {
    const result = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

function populateUI(songinfo) {
    if (songinfo) {
        document.getElementsByClassName("song").innerText = songinfo.name;
        document.getElementsByClassName("album").innerText = songinfo.album.name;
        document.getElementsByClassName("artist").innerText = songinfo.artists.name;
        songLen = int(songinfo.duration_ms / 1000);

        //document.getElementsByTagName("meta").content = songLen;
    }
    else {
        //document.getElementsByTagName("meta").content = 1
    }
}