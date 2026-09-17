const express = require("express");
const router = express.Router();
const https = require("https");
const User = require("../models/user");
const WeatherHistory = require("../models/weatherHistory");

// Get Air Quality Data
const getAirQualityData = (lat, lon) => {

    return new Promise((resolve, reject) => {

        const url =
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}`;

        https.get(url, (response) => {

            let data = "";

            response.on("data", (chunk) => {
                data += chunk;
            });

            response.on("end", () => {

                try {

                    const result = JSON.parse(data);

                    if (response.statusCode !== 200) {
                        return reject(result);
                    }

                    resolve(result);

                } catch (error) {
                    reject(error);
                }

            });

        }).on("error", (error) => {
            reject(error);
        });

    });
};
/* PERSONALIZED WEATHER DATA */

function getPersonalizedData(userType, weather) {

    const temp = weather.main.temp;
    const feelsLike = weather.main.feels_like;
    const humidity = weather.main.humidity;
    const windSpeed = weather.wind.speed;
    const weatherCondition = weather.weather[0].description;

    switch (userType) {

        case "health":
            return {
                message: "Health-focused weather information",
                advice: temp >= 35
                    ? "High temperature detected. Stay hydrated and avoid prolonged outdoor exposure."
                    : "Current weather conditions are suitable for normal outdoor activities.",
                temperature: `${temp}°C`,
                feelsLike: `${feelsLike}°C`,
                humidity: `${humidity}%`,
                windSpeed: `${windSpeed} m/s`
            };

        case "fitness":
            return {
                message: "Fitness-focused weather information",
                advice: temp >= 35
                    ? "High temperature may make outdoor exercise uncomfortable. Consider exercising during cooler hours."
                    : "Current conditions are suitable for outdoor fitness activities.",
                temperature: `${temp}°C`,
                windSpeed: `${windSpeed} m/s`,
                humidity: `${humidity}%`,
                condition: weatherCondition
            };

        case "beach":
            return {
                message: "Beach weather information",
                advice: "Check local beach and marine conditions before planning water activities.",
                temperature: `${temp}°C`,
                humidity: `${humidity}%`,
                windSpeed: `${windSpeed} m/s`,
                condition: weatherCondition
            };

        case "traveler":
            return {
                message: "Travel-focused weather information",
                advice: weatherCondition.includes("rain")
                    ? "Rain is expected. Carry suitable rain protection while travelling."
                    : "Current conditions are suitable for travel.",
                temperature: `${temp}°C`,
                condition: weatherCondition,
                humidity: `${humidity}%`,
                windSpeed: `${windSpeed} m/s`
            };

        case "family":
            return {
                message: "Family-focused weather information",
                advice: weatherCondition.includes("rain")
                    ? "Rain may affect outdoor activities and daily commuting. Plan accordingly."
                    : "Current conditions are suitable for normal family activities.",
                temperature: `${temp}°C`,
                humidity: `${humidity}%`,
                condition: weatherCondition,
                windSpeed: `${windSpeed} m/s`
            };

        case "agriculture":
            return {
                message: "Agriculture-focused weather information",
                advice: weatherCondition.includes("rain")
                    ? "Rainfall conditions may be useful for agricultural activities. Monitor local rainfall before irrigation decisions."
                    : "No significant rainfall condition is currently indicated.",
                temperature: `${temp}°C`,
                humidity: `${humidity}%`,
                windSpeed: `${windSpeed} m/s`
            };

        case "commuter":
            return {
                message: "Commuter-focused weather information",
                advice: weatherCondition.includes("rain")
                    ? "Rain may affect your commute. Allow additional travel time and carry rain protection."
                    : "Current weather conditions are suitable for commuting.",
                temperature: `${temp}°C`,
                condition: weatherCondition,
                windSpeed: `${windSpeed} m/s`,
                humidity: `${humidity}%`
            };

        case "event":
            return {
                message: "Event planning weather information",
                advice: weatherCondition.includes("rain")
                    ? "Rain may affect outdoor events. Consider a covered venue or backup arrangement."
                    : "Current conditions are suitable for outdoor event planning.",
                temperature: `${temp}°C`,
                condition: weatherCondition,
                humidity: `${humidity}%`,
                windSpeed: `${windSpeed} m/s`
            };

        default:
            return {
                message: "General weather information",
                advice: "Check the latest weather conditions before planning outdoor activities.",
                temperature: `${temp}°C`,
                feelsLike: `${feelsLike}°C`,
                humidity: `${humidity}%`,
                windSpeed: `${windSpeed} m/s`,
                condition: weatherCondition
            };
    }
}
/* TODAY'S PERSONALIZED SUGGESTIONS */
function getSuggestions(userType, weather, aqi, forecastList) {

    const suggestions = [];

    const temp = weather.main.temp;
    const humidity = weather.main.humidity;
    const windSpeed = weather.wind.speed;

    const condition =
        weather.weather[0].description.toLowerCase();

    // Current weather

    if (
        condition.includes("rain") ||
        condition.includes("drizzle")
    ) {
        suggestions.push({
            icon: "fa-solid fa-umbrella",
            title: "Rain Alert",
            text: "Rain is currently affecting the weather. Keep rain protection with you."
        });
    }

    if (temp >= 35) {
        suggestions.push({
            icon: "fa-solid fa-temperature-high",
            title: "High Temperature",
            text: "Temperature is high today. Stay hydrated and avoid prolonged outdoor exposure."
        });
    }

    if (humidity >= 80) {
        suggestions.push({
            icon: "fa-solid fa-droplet",
            title: "High Humidity",
            text: "Humidity is high today. Stay hydrated and take regular breaks."
        });
    }

    if (windSpeed >= 10) {
        suggestions.push({
            icon: "fa-solid fa-wind",
            title: "Strong Wind",
            text: "Strong winds are present. Take extra care during outdoor activities."
        });
    }


    /* =========================
       AIR QUALITY
    ========================= */

    if (aqi >= 4) {

        suggestions.push({
            icon: "fa-solid fa-mask-face",
            title: "Air Quality Alert",
            text: "Air quality is poor. Consider reducing prolonged outdoor exposure."
        });

    }


    /* =========================
       FORECAST ANALYSIS
    ========================= */

    let rainExpected = false;
    let highRainProbability = false;

    if (forecastList && forecastList.length > 0) {

        for (const forecast of forecastList) {

            const rainProbability =
                (forecast.pop || 0) * 100;

            const forecastCondition =
                forecast.weather &&
                forecast.weather[0]
                    ? forecast.weather[0].description.toLowerCase()
                    : "";

            if (
                forecastCondition.includes("rain") ||
                forecastCondition.includes("drizzle") ||
                rainProbability >= 50
            ) {
                rainExpected = true;
            }

            if (rainProbability >= 60) {
                highRainProbability = true;
            }
        }
    }


    /* =========================
       PERSONALIZED SUGGESTIONS
    ========================= */

    switch (userType) {

        /* ---------- TRAVELER ---------- */

        case "traveler":

            if (highRainProbability) {

                suggestions.push({
                    icon: "fa-solid fa-cloud-rain",
                    title: "Rain Expected",
                    text: "Rain is likely during the forecast period. Keep rain gear with you while travelling."
                });

            } else if (rainExpected) {

                suggestions.push({
                    icon: "fa-solid fa-umbrella",
                    title: "Possible Rain",
                    text: "Rain may occur during the forecast period. Keep rain protection with you."
                });

            } else if (temp >= 35) {

                suggestions.push({
                    icon: "fa-solid fa-bottle-water",
                    title: "Stay Hydrated",
                    text: "High temperatures are expected. Carry enough water while travelling."
                });

            } else {

                suggestions.push({
                    icon: "fa-solid fa-suitcase",
                    title: "Travel Conditions",
                    text: "Weather conditions look suitable for travelling. Check the latest forecast before departure."
                });

            }

            break;


        /* ---------- FITNESS ---------- */

        case "fitness":

            if (rainExpected) {

                suggestions.push({
                    icon: "fa-solid fa-dumbbell",
                    title: "Indoor Workout Recommended",
                    text: "Rain is possible during the forecast period. Consider an indoor workout."
                });

            } else if (temp >= 35) {

                suggestions.push({
                    icon: "fa-solid fa-person-running",
                    title: "Choose Cooler Hours",
                    text: "High temperatures are expected. Prefer early morning or evening exercise."
                });

            } else {

                suggestions.push({
                    icon: "fa-solid fa-person-running",
                    title: "Good for Fitness",
                    text: "Current weather conditions look suitable for outdoor exercise."
                });

            }

            break;


        /* ---------- COMMUTER ---------- */

        case "commuter":

            if (rainExpected) {

                suggestions.push({
                    icon: "fa-solid fa-car",
                    title: "Commute Alert",
                    text: "Rain is possible during your commute. Carry rain protection and allow extra travel time."
                });

            } else if (windSpeed >= 10) {

                suggestions.push({
                    icon: "fa-solid fa-wind",
                    title: "Windy Commute",
                    text: "Strong winds are present. Travel carefully and check road conditions."
                });

            } else {

                suggestions.push({
                    icon: "fa-solid fa-car",
                    title: "Commute Conditions",
                    text: "Current weather conditions look suitable for normal commuting."
                });

            }

            break;


        /* ---------- AGRICULTURE ---------- */

        case "agriculture":

            if (rainExpected) {

                suggestions.push({
                    icon: "fa-solid fa-seedling",
                    title: "Rain Expected",
                    text: "Rain is possible during the forecast period. Check soil moisture before irrigation."
                });

            } else if (temp >= 35) {

                suggestions.push({
                    icon: "fa-solid fa-seedling",
                    title: "Monitor Soil Moisture",
                    text: "High temperatures may increase water requirements. Monitor soil moisture regularly."
                });

            } else {

                suggestions.push({
                    icon: "fa-solid fa-seedling",
                    title: "Monitor Weather",
                    text: "Monitor upcoming weather conditions before making irrigation decisions."
                });

            }

            break;


        /* ---------- BEACH ---------- */

        case "beach":

            if (rainExpected) {

                suggestions.push({
                    icon: "fa-solid fa-umbrella-beach",
                    title: "Beach Weather Alert",
                    text: "Rain is possible during the forecast period. Consider postponing outdoor beach activities."
                });

            } else if (windSpeed >= 8) {

                suggestions.push({
                    icon: "fa-solid fa-wind",
                    title: "Beach Wind Caution",
                    text: "Wind speed is relatively high. Check local conditions before water activities."
                });

            } else {

                suggestions.push({
                    icon: "fa-solid fa-umbrella-beach",
                    title: "Beach Conditions",
                    text: "Current conditions look suitable for outdoor beach activities."
                });

            }

            break;


        /* ---------- FAMILY ---------- */

        case "family":

            if (rainExpected) {

                suggestions.push({
                    icon: "fa-solid fa-house",
                    title: "Plan Indoor Activities",
                    text: "Rain is possible during the forecast period. Consider an indoor family activity."
                });

            } else if (temp >= 35) {

                suggestions.push({
                    icon: "fa-solid fa-people-group",
                    title: "Avoid Peak Heat",
                    text: "High temperatures are expected. Prefer outdoor family activities during cooler hours."
                });

            } else {

                suggestions.push({
                    icon: "fa-solid fa-people-group",
                    title: "Family Activity",
                    text: "Weather conditions look suitable for outdoor family activities."
                });

            }

            break;


        /* ---------- EVENT ---------- */

        case "event":

            if (rainExpected) {

                suggestions.push({
                    icon: "fa-solid fa-calendar-xmark",
                    title: "Event Weather Alert",
                    text: "Rain is possible during the forecast period. Keep a covered venue or backup arrangement ready."
                });

            } else if (windSpeed >= 10) {

                suggestions.push({
                    icon: "fa-solid fa-wind",
                    title: "Outdoor Event Caution",
                    text: "Strong winds may affect outdoor arrangements. Check the latest forecast before the event."
                });

            } else {

                suggestions.push({
                    icon: "fa-solid fa-calendar-check",
                    title: "Event Planning",
                    text: "Current weather conditions look suitable for outdoor event planning."
                });

            }

            break;


        /* ---------- HEALTH ---------- */

        case "health":

            if (aqi >= 4) {

                suggestions.push({
                    icon: "fa-solid fa-heart-pulse",
                    title: "Health Precaution",
                    text: "Poor air quality may affect outdoor activities. Consider limiting prolonged exposure."
                });

            } else if (temp >= 35) {

                suggestions.push({
                    icon: "fa-solid fa-heart-pulse",
                    title: "Heat Precaution",
                    text: "High temperature is expected. Stay hydrated and avoid prolonged outdoor exposure."
                });

            } else {

                suggestions.push({
                    icon: "fa-solid fa-heart-pulse",
                    title: "Weather Looks Comfortable",
                    text: "Current weather conditions look suitable for normal outdoor activities."
                });

            }

            break;
    }

    return suggestions.slice(0, 5);
}
 
function buildDailyForecast(forecastList) {

    const dailyForecast = {};

    forecastList.forEach((item) => {

        const date = item.dt_txt.split(" ")[0];

        if (!dailyForecast[date]) {

            dailyForecast[date] = {
                date: date,
                minTemp: item.main.temp,
                maxTemp: item.main.temp,

                humiditySum: item.main.humidity,
                humidityCount: 1,

                windSpeedSum: item.wind.speed,
                windSpeedCount: 1,

                rainProbability: item.pop,

                weather: item.weather[0].description,
                icon: item.weather[0].icon
            };

        } else {

            dailyForecast[date].minTemp = Math.min(
                dailyForecast[date].minTemp,
                item.main.temp
            );

            dailyForecast[date].maxTemp = Math.max(
                dailyForecast[date].maxTemp,
                item.main.temp
            );

            dailyForecast[date].humiditySum += item.main.humidity;
            dailyForecast[date].humidityCount++;

            dailyForecast[date].windSpeedSum += item.wind.speed;
            dailyForecast[date].windSpeedCount++;

            dailyForecast[date].rainProbability = Math.max(
                dailyForecast[date].rainProbability,
                item.pop
            );
        }
    });

    return Object.values(dailyForecast).map((day) => ({
        date: day.date,

        minTemp: Number(day.minTemp.toFixed(2)),

        maxTemp: Number(day.maxTemp.toFixed(2)),

        humidity: Math.round(
            day.humiditySum / day.humidityCount
        ),

        windSpeed: Number(
            (day.windSpeedSum / day.windSpeedCount).toFixed(2)
        ),

        rainProbability: day.rainProbability,

        weather: day.weather,

        icon: day.icon
    }));
}

router.get("/weather", (req, res) => {
    const city = req.query.city;
    if (!city) {
        return res.send("Please enter a city");
    }
    const apiKey = process.env.WEATHER_API_KEY;

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;


    https.get(url, (response) => {
        let data = "";
        response.on("data", (chunk) => {
            data += chunk;
        });

        // response.on("end",() =>{
        //     const weatherData = JSON.parse(data);

        //     if(weatherData.cod != 200){
        //         return res.send("City not found");
        //     }

        //     res.json(weatherData);
        // });
        response.on("end", () => {


            const weatherData = JSON.parse(data);

            if (weatherData.cod !== 200) {
                return res.status(weatherData.cod).json({
                    error: weatherData.message
                });
            }

            res.json(weatherData);

        });
    }).on("error", (error) => {
        console.log("Weather API Error:", error);
        res.send("Weather API error");
    });
});

router.get("/weather/forecast", (req, res) => {
    const city = req.query.city;

    if (!city) {
        return res.send("Please enter a city");
    }

    const apiKey = process.env.WEATHER_API_KEY;

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

    https.get(url, (response) => {
        let data = "";

        response.on("data", (chunk) => {
            data += chunk;
        });

        response.on("end", () => {
            try {
                const forecastData = JSON.parse(data);

                if (forecastData.cod !== "200" && forecastData.cod !== 200) {
                    return res.status(400).json({
                        error: forecastData.message
                    });
                }

                const result = buildDailyForecast(forecastData.list);

                res.json({
                    city: forecastData.city.name,
                    forecast: result
                });

            } catch (error) {
                console.log("Forecast JSON Error:", error);
                res.send("Invalid forecast data");
            }
        });

    }).on("error", (error) => {
        console.log("Forecast API Error:", error);
        res.send("Forecast API error");
    });
});
 

router.get("/personalized-weather", async (req, res) => {
    try {
        // Check login
        if (!req.session.userId) {
            return res.status(401).json({
                error: "Please login first"
            });
        }

        const city = req.query.city;

        if (!city) {
            return res.status(400).json({
                error: "Please enter a city"
            });
        }

        // Find logged-in user
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        // User type check
        if (!user.userType) {
            return res.status(400).json({
                error: "Please select your user type first"
            });
        }

        const apiKey = process.env.WEATHER_API_KEY;

        const currentWeatherUrl =
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

        const forecastUrl =
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

        // Function to get API data
        const getWeatherData = (url) => {
            return new Promise((resolve, reject) => {

                https.get(url, (response) => {
                    let data = "";

                    response.on("data", (chunk) => {
                        data += chunk;
                    });

                    response.on("end", () => {
                        try {
                            resolve(JSON.parse(data));
                        } catch (error) {
                            reject(error);
                        }
                    });

                }).on("error", (error) => {
                    reject(error);
                });
            });
        };

        // Get current weather + forecast
        const currentWeather = await getWeatherData(currentWeatherUrl);
        const forecastData = await getWeatherData(forecastUrl);

        // API error check
        if (currentWeather.cod !== 200) {
            return res.status(400).json({
                error: currentWeather.message
            });
        }

        if (forecastData.cod !== "200" && forecastData.cod !== 200) {
            return res.status(400).json({
                error: forecastData.message
            });
        }

        // Save weather history
        console.log("Saving weather history...");
        await WeatherHistory.create({
            user: user._id,
            city: currentWeather.name,
            temperature: currentWeather.main.temp,
            feelsLike: currentWeather.main.feels_like,
            humidity: currentWeather.main.humidity,
            windSpeed: currentWeather.wind.speed,
            weather: currentWeather.weather[0].description,
            icon: currentWeather.weather[0].icon
        });
        console.log("Weather history saved successfully!");
        // Send combined response
        res.json({
            user: {
                name: user.name,
                userType: user.userType
            },

            city: currentWeather.name,

            currentWeather: {
                temperature: currentWeather.main.temp,
                feelsLike: currentWeather.main.feels_like,
                humidity: currentWeather.main.humidity,
                windSpeed: currentWeather.wind.speed,
                weather: currentWeather.weather[0].description,
                icon: currentWeather.weather[0].icon
            },

            forecast: buildDailyForecast(forecastData.list),

            personalized: getPersonalizedData(
                user.userType,
                currentWeather
            )
        });

    } catch (error) {
        console.log("Personalized Weather Error:", error);

        res.status(500).json({
            error: "Unable to get personalized weather"
        });
    }
});
// Weather History
router.get("/weather-history", async (req, res) => {
    try {

        // Check login
        if (!req.session.userId) {
            return res.status(401).json({
                message: "Please login first"
            });
        }

        // Find user's history
        const history = await WeatherHistory.find({
            user: req.session.userId
        })
            .sort({ searchedAt: -1 });

        res.json({
            success: true,
            count: history.length,
            history: history
        });

    } catch (error) {

        console.log("Weather history error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to get weather history"
        });
    }
});
router.get("/weather-history-page", async (req, res) => {

    try {

        if (!req.session.userId) {
            return res.redirect("/login");
        }

        const history = await WeatherHistory.find({
            user: req.session.userId
        })
            .sort({ searchedAt: -1 });

        res.render("weather-history", {
            history
        });

    } catch (error) {

        console.log("Weather history page error:", error);

        res.send("Unable to load weather history");
    }
});

// Dashboard API
router.get("/dashboard-data", async (req, res) => {

    try {
        let user = null;
        if (req.session.userId) {
            user = await User.findById(req.session.userId);
        }
        // Get city
        const city = req.query.city || "Kolkata";

        // OpenWeather URLs
        const currentUrl =
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.WEATHER_API_KEY}&units=metric`;

        const forecastUrl =
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${process.env.WEATHER_API_KEY}&units=metric`;

        // Helper function
        const getWeatherData = (url) => {

            return new Promise((resolve, reject) => {

                https.get(url, (response) => {

                    let data = "";

                    response.on("data", (chunk) => {
                        data += chunk;
                    });

                    response.on("end", () => {

                        try {

                            const result = JSON.parse(data);

                            if (response.statusCode !== 200) {
                                return reject(result);
                            }

                            resolve(result);

                        } catch (error) {
                            reject(error);
                        }

                    });

                }).on("error", (error) => {
                    reject(error);
                });

            });
        };

        const [currentWeather, forecastData] = await Promise.all([
            getWeatherData(currentUrl),
            getWeatherData(forecastUrl)
        ]);
        // Get AQI
        const airQualityData = await getAirQualityData(
            currentWeather.coord.lat,
            currentWeather.coord.lon
        );
        const aqi = airQualityData.list[0].main.aqi;
        let aqiStatus;

        switch (aqi) {

            case 1:
                aqiStatus = "Good";
                break;

            case 2:
                aqiStatus = "Fair";
                break;

            case 3:
                aqiStatus = "Moderate";
                break;

            case 4:
                aqiStatus = "Poor";
                break;

            case 5:
                aqiStatus = "Very Poor";
                break;

            default:
                aqiStatus = "Unknown";
        }
        // Personalized data
        const personalizedData = getPersonalizedData(
            user ? user.userType : null,
            currentWeather
        );
        // Today's personalized suggestions
        const suggestions = getSuggestions(
            user ? user.userType : null,
            currentWeather,
            aqi,
            forecastData.list
        );
        // Send dashboard data
        res.json({

            success: true,

            user: user
                ? {
                    name: user.name,
                    email: user.email,
                    userType: user.userType
                }
                : null,

            currentWeather: {
                city: currentWeather.name,
                temperature: currentWeather.main.temp,
                feelsLike: currentWeather.main.feels_like,
                humidity: currentWeather.main.humidity,
                windSpeed: currentWeather.wind.speed,
                weather: currentWeather.weather[0].description,
                icon: currentWeather.weather[0].icon
            },

            airQuality: {
                aqi: aqi,
                status: aqiStatus
            },

            forecast: buildDailyForecast(
                forecastData.list
            ),

            personalizedData: personalizedData,

            suggestions: suggestions

        });

    } catch (error) {

        console.log("Dashboard data error:", error);

        if (error && error.message) {

            return res.status(400).json({
                success: false,
                message: error.message
            });

        }

        return res.status(500).json({
            success: false,
            message: "Unable to load dashboard data"
        });

    }

});

module.exports = router;