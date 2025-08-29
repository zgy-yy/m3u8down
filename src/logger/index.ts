import log4js from 'log4js';

log4js.configure({
    appenders: {
      out: { type: "stdout" }, // 输出到控制台
      app: {
        type: "file", // 使用 file appender 进行文件输出
        filename: "logs/app.log", // 日志文件路径（不需要扩展名，自动添加）
        pattern: "yyyy-MM-dd", // 日志文件轮换的模式，按天轮换
        alwaysIncludePattern: true, // 始终在文件名中添加日期后缀
        daysToKeep: 90, // 保留最近 90 天的日志文件
        compress: true, // 启用日志文件压缩（.gz 格式）
      },
    },
    categories: {
      default: { appenders: ["out", "app"], level: "info" }, // 设置日志级别和输出方式
    },
  });

const logger = log4js.getLogger();

export default logger;