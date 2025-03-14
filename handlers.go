package main

import (
	"encoding/json"
	"net/http"
	"os"
	"server/logger"

	"github.com/go-chi/chi/v5"
	"github.com/sirupsen/logrus"
)

// Добавляем структуры для работы с БСУ
type ConnectionRequest struct {
    IP          string `json:"ip"`
    Port        int    `json:"port"`
    DispatcherID string `json:"dispatcherId"`
}
type Subscriber struct {
    ID     string  `json:"id"`
    Name   string  `json:"name"`   
    Icon   string  `json:"icon"`  
    Lat    float64 `json:"lat"`
    Lon    float64 `json:"lon"`
    Status string  `json:"status"`
}

func connectToBSU(w http.ResponseWriter, r *http.Request) {
    var req ConnectionRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        logger.Log.WithError(err).Error("Ошибка декодирования запроса")
        http.Error(w, "Bad Request", http.StatusBadRequest)
        return
    }

    // Логика подключения к БСУ
    logger.Log.WithFields(logrus.Fields{
        "ip":          req.IP,
        "port":        req.Port,
        "dispatcherId": req.DispatcherID,
    }).Info("Попытка подключения к БСУ")

    // Здесь должна быть реальная логика подключения
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{
        "status": "connected",
        "dispatcherId": req.DispatcherID,
    })
}

// Добавляем эндпоинт в роутер (main.go)


func getSubscribers(w http.ResponseWriter, r *http.Request) {
	logger.Log.WithFields(logrus.Fields{
		"method": r.Method,
		"path":   r.URL.Path,
	}).Debug("Handling request")

	subs := loadSubscribers()
	
	if err := json.NewEncoder(w).Encode(subs); err != nil {
		logger.Log.WithError(err).Error("Failed to encode response")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func addSubscriber(w http.ResponseWriter, r *http.Request) {
	logEntry := logger.Log.WithFields(logrus.Fields{
		"method": r.Method,
		"path":   r.URL.Path,
	})
	
	var sub Subscriber
	if err := json.NewDecoder(r.Body).Decode(&sub); err != nil {
		logEntry.WithError(err).Warn("Invalid request body")
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}
	
	subs := loadSubscribers()
	subs = append(subs, sub)
	saveSubscribers(subs)
	
	logEntry.WithFields(logrus.Fields{
		"subscriber_id": sub.ID,
		"lat":          sub.Lat,
		"lon":          sub.Lon,
	}).Info("New subscriber added")
	
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(sub)
}

func getGroups(w http.ResponseWriter, r *http.Request) {
	dispatcherID := chi.URLParam(r, "dispatcherId")
	logEntry := logger.Log.WithFields(logrus.Fields{
		"method":       r.Method,
		"path":         r.URL.Path,
		"dispatcherId": dispatcherID,
	})
	
	groups, ok := dispatchers[dispatcherID]
	if !ok {
		logEntry.Warn("Dispatcher not found")
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}
	
	if err := json.NewEncoder(w).Encode(groups); err != nil {
		logEntry.WithError(err).Error("Failed to encode response")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func loadSubscribers() []Subscriber {
	data, err := os.ReadFile("subscribers.json")
	if err != nil {
		logger.Log.WithError(err).Warn("Failed to read subscribers file")
		return []Subscriber{}
	}
	
	var subs []Subscriber
	if err := json.Unmarshal(data, &subs); err != nil {
		logger.Log.WithError(err).Error("Failed to parse subscribers data")
		return []Subscriber{}
	}
	
	return subs
}

func saveSubscribers(subs []Subscriber) {
	data, err := json.MarshalIndent(subs, "", "  ")
	if err != nil {
		logger.Log.WithError(err).Error("Failed to marshal subscribers data")
		return
	}
	
	if err := os.WriteFile("subscribers.json", data, 0644); err != nil {
		logger.Log.WithError(err).Error("Failed to save subscribers data")
	}
}

// В handlers.go
func getDispatchers(w http.ResponseWriter, r *http.Request) {
    dispatcherList := make([]string, 0, len(dispatchers))
    for k := range dispatchers {
        dispatcherList = append(dispatcherList, k)
    }
    
    json.NewEncoder(w).Encode(dispatcherList)
}

// В роутер (main.go)
