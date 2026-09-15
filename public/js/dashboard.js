/* LOAD DASHBOARD */

async function loadDashboard(city) {
    try {
        const response = await fetch(
            `/dashboard-data?city=${encodeURIComponent(city)}`
        );

        const data = await response.json();

        console.log("HTTP Status:", response.status);
        console.log("Dashboard Response:", data);

        if (!response.ok || !data.success) {
            alert(data.message || data.error || "Unable to load weather");
            return;
        }

        console.log("Dashboard Data:", data);


        /* CURRENT WEATHER */

        document.getElementById("city").innerText =
            data.currentWeather.city;

        document.getElementById("temperature").innerText =
            data.currentWeather.temperature + "°C";

        document.getElementById("weather").innerText =
            data.currentWeather.weather;

        document.getElementById("feelsLike").innerText =
            data.currentWeather.feelsLike + "°C";

        document.getElementById("humidity").innerText =
            data.currentWeather.humidity + "%";

        document.getElementById("windSpeed").innerText =
            data.currentWeather.windSpeed + " m/s";


        /* CURRENT WEATHER ICON */

        const currentWeatherIcon =
            document.querySelector(".weather-icon i");

        if (currentWeatherIcon) {
            currentWeatherIcon.className =
                `fa-solid ${getWeatherIcon(data.currentWeather.weather)}`;
        }


        /* AQI */

        document.getElementById("aqi").innerText =
            data.airQuality.aqi;

        const aqiStatus =
            document.getElementById("aqiStatus");

        aqiStatus.innerText =
            data.airQuality.status;

        aqiStatus.className = "";

        const status =
            data.airQuality.status.toLowerCase();

        if (status.includes("very poor")) {
            aqiStatus.classList.add("aqi-very-poor");
        }
        else if (status.includes("poor")) {
            aqiStatus.classList.add("aqi-poor");
        }
        else if (status.includes("moderate")) {
            aqiStatus.classList.add("aqi-moderate");
        }
        else if (status.includes("fair")) {
            aqiStatus.classList.add("aqi-fair");
        }
        else if (status.includes("good")) {
            aqiStatus.classList.add("aqi-good");
        }


        /* FORECAST */

        const forecastContainer =
            document.getElementById("forecastContainer");

        forecastContainer.innerHTML = "";

        data.forecast.slice(0, 5).forEach(day => {

            const date = new Date(day.date);

            const formattedDate =
                date.toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short"
                });

            forecastContainer.innerHTML += `
                <div class="forecast-card">

                    <div class="forecast-date">
                        ${formattedDate}
                    </div>

                    <div class="forecast-icon">
                        <i class="fa-solid ${getWeatherIcon(day.weather)}"></i>
                    </div>

                    <div class="forecast-temperature">
                        <strong>${day.maxTemp}°C</strong>
                        <span>${day.minTemp}°C</span>
                    </div>

                    <p class="forecast-weather">
                        ${day.weather}
                    </p>

                    <div class="forecast-info">

                        <span>
                            <i class="fa-solid fa-droplet"></i>
                            ${day.humidity}%
                        </span>

                        <span>
                            <i class="fa-solid fa-wind"></i>
                            ${day.windSpeed} m/s
                        </span>

                    </div>

                </div>
            `;
        });


        /* PERSONALIZED DATA */

        console.log("Logged in user:", data.user);
        console.log("User Type:", data.user?.userType);
        console.log("Personalized Data:", data.personalizedData);

        const personalized =
            data.personalizedData;

        document.getElementById("personalizedMessage").innerText =
            personalized.message;

        document.getElementById("personalizedAdvice").innerText =
            personalized.advice;

        const details =
            document.getElementById("personalizedDetails");

        details.innerHTML = "";

        Object.entries(personalized).forEach(([key, value]) => {

            if (key === "message" || key === "advice") {
                return;
            }

            details.innerHTML += `
                <div class="personalized-detail">

                    <span>
                        ${formatLabel(key)}
                    </span>

                    <strong>
                        ${value}
                    </strong>

                </div>
            `;
        });


        /* TODAY'S SUGGESTIONS */

        console.log("Today's Suggestions:", data.suggestions);

        const suggestionsContainer =
            document.getElementById("suggestionsContainer");

        if (suggestionsContainer) {

            suggestionsContainer.innerHTML = "";

            if (
                data.suggestions &&
                data.suggestions.length > 0
            ) {

                data.suggestions.forEach(suggestion => {

                    suggestionsContainer.innerHTML += `
                        <div class="suggestion-card">

                            <div class="suggestion-icon">

                                <i class="${suggestion.icon}"></i>

                            </div>

                            <div class="suggestion-content">

                                <h3>
                                    ${suggestion.title}
                                </h3>

                                <p>
                                    ${suggestion.text}
                                </p>

                            </div>

                        </div>
                    `;

                });

            } else {

                suggestionsContainer.innerHTML = `
                    <div class="no-suggestions">

                        <i class="fa-solid fa-circle-check"></i>

                        <p>
                            No special weather suggestions
                            for today.
                        </p>

                    </div>
                `;

            }

        }

    } catch (error) {

        console.log("Dashboard error:", error);

    }
}



/* DASHBOARD SEARCH */

const searchForm =
    document.getElementById("searchForm");

if (searchForm) {

    searchForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const city =
            document.getElementById("cityInput").value.trim();

        if (city === "") {
            return;
        }

        loadDashboard(city);

    });

}



/* HEADER SEARCH */

const headerSearchButton =
    document.getElementById("headerSearchButton");

const headerCitySearch =
    document.getElementById("headerCitySearch");

if (headerSearchButton && headerCitySearch) {

    headerSearchButton.addEventListener("click", function () {

        const city =
            headerCitySearch.value.trim();

        if (city === "") {
            return;
        }

        loadDashboard(city);

        document
            .getElementById("current-weather")
            ?.scrollIntoView({
                behavior: "smooth"
            });

    });


    headerCitySearch.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            headerSearchButton.click();

        }
    });
}
/* WEATHER ICON */
function getWeatherIcon(weather) {

    const condition =
        weather.toLowerCase();

    if (condition.includes("thunderstorm")) {
        return "fa-cloud-bolt";
    }

    if (
        condition.includes("drizzle") ||
        condition.includes("light rain")
    ) {
        return "fa-cloud-rain";
    }

    if (
        condition.includes("rain") ||
        condition.includes("shower")
    ) {
        return "fa-cloud-showers-heavy";
    }

    if (
        condition.includes("snow") ||
        condition.includes("sleet")
    ) {
        return "fa-snowflake";
    }

    if (
        condition.includes("mist") ||
        condition.includes("fog") ||
        condition.includes("haze")
    ) {
        return "fa-smog";
    }

    if (condition.includes("cloud")) {
        return "fa-cloud";
    }

    if (condition.includes("clear")) {
        return "fa-sun";
    }

    return "fa-cloud-sun";
}
/* FORMAT LABEL */

function formatLabel(text) {

    return text
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, str => str.toUpperCase());

}
/* DEFAULT CITY */

loadDashboard("Patna");