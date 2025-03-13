
package logger

import (
	"os"
	"github.com/sirupsen/logrus"
)

var Log = logrus.New()
func Init() {
    Log.SetFormatter(&logrus.JSONFormatter{
        TimestampFormat: "2006-01-02 15:04:05",
    })

    // Создание папки для логов
    if err := os.MkdirAll("logs", 0755); err != nil {
        Log.WithError(err).Fatal("Ошибка создания папки для логов")
    }

    // Настройка ротации логов
    file, err := os.OpenFile("logs/server.log", 
        os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
    
    if err == nil {
        Log.SetOutput(file)
    } else {
        Log.WithError(err).Warn("Ошибка записи в файл, используется stdout")
    }

    Log.SetLevel(logrus.DebugLevel)
}