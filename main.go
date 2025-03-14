package main

import (
	"embed"
	"io/fs"
	"net/http"
	"os"
	"path"

	"server/logger"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/sirupsen/logrus"
)

//go:embed all:client/static/*
var clientFS embed.FS


type Group struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

var dispatchers = map[string][]Group{
	"dispatcher1": {
		{ID: "group1", Name: "Группа 1"},
		{ID: "group2", Name: "Группа 2"},
	},
	"dispatcher2": {
		{ID: "group3", Name: "Группа 3"},
	},
}

func main() {
	logger.Init()
	logger.Log.Info("Initializing server...")
	
	r := chi.NewRouter()
	
	r.Use(middleware.RequestLogger(&middleware.DefaultLogFormatter{
		Logger:  logger.Log,
		NoColor: true,
	}))
	r.Use(middleware.Recoverer)
	
	r.Route("/api", func(r chi.Router) {
        r.Get("/subscribers", getSubscribers)
        r.Post("/subscribers", addSubscriber)
        r.Get("/dispatchers/{dispatcherId}/groups", getGroups)
        r.Post("/connect-bsu", connectToBSU)      
        r.Get("/dispatchers", getDispatchers) 
	})
	
	r.Get("/*", serveClientFiles())
	
	logger.Log.WithFields(logrus.Fields{
		"port": 8080,
	}).Info("Server started")
	
	if err := http.ListenAndServe(":8080", r); err != nil {
		logger.Log.WithError(err).Fatal("Server startup failed")
	}
	r.Post("/api/connect-bsu", connectToBSU)
	r.Get("/api/dispatchers", getDispatchers)
}

func serveClientFiles() http.HandlerFunc {
	fsys, err := fs.Sub(clientFS, "client/static")
	if err != nil {
		logger.Log.WithError(err).Fatal("Failed to create sub filesystem")
	}

	fileServer := http.FileServer(http.FS(fsys))

	return func(w http.ResponseWriter, r *http.Request) {
		path := path.Clean(r.URL.Path)
		_, err := fs.Stat(fsys, path)
		
		if os.IsNotExist(err) {
			logger.Log.WithFields(logrus.Fields{
				"path":   path,
				"method": r.Method,
			}).Debug("Serving index.html")
			
			index, err := fs.ReadFile(fsys, "index.html")
			if err != nil {
				logger.Log.WithError(err).Error("Index file not found")
				http.Error(w, "Not Found", http.StatusNotFound)
				return
			}
			w.Header().Set("Content-Type", "text/html")
			w.Write(index)
			return
		}
		
		fileServer.ServeHTTP(w, r)
	}
}