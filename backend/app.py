import pandas as pd
import numpy as np
from flask import Flask, jsonify, request, send_file, Response, send_from_directory
from flask_cors import CORS
import requests
import os
import pymysql
from werkzeug.utils import secure_filename
from werkzeug.security import safe_join
import time
from functools import wraps
from sklearn.linear_model import LinearRegression  # 修改导入语句
import logging # 新增导入
import socket
import subprocess
import re
import datetime
from pymysql.cursors import DictCursor

# 新增导入：PDF生成和图表绘制
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # 使用非交互式后端
import seaborn as sns
import io
import base64

app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": ["http://localhost:3000", "http://10.130.126.249:3000", "*"],  # 添加通配符允许所有来源
    "methods": ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# 配置基本日志
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

@app.before_request
def log_request_info():
    app.logger.debug('Headers: %s', request.headers)
    app.logger.debug('Body: %s', request.get_data())
    app.logger.debug('Origin: %s', request.origin)
    app.logger.debug('Path: %s', request.path)
    app.logger.debug('Method: %s', request.method)

# 配置允许的文件上传类型
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456',  # 请更改为你的数据库密码
    'db': 'oceanmonitor',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

# 根路由 - 展示所有API端点
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "status": "success",
        "message": "Ocean Monitor API 已启动",
        "endpoints": {
            "水质监测": [
                "/api/water-quality - 获取水质数据",
                "/api/water-quality/periods - 获取可用时间段",
                "/api/water-quality/provinces - 获取所有省份",
                "/api/water-quality/basins - 获取所有流域",
                "/api/water-quality/statistics - 获取水质统计数据"
            ],
            "鱼类数据": [
                "/api/fish-statistics - 获取鱼类统计数据"
            ],
            "用户管理": [
                "/api/register - 用户注册 (POST)",
                "/api/login - 用户登录 (POST)",
                "/api/users - 获取所有用户",
                "/api/get_user/<username> - 获取单个用户",
                "/api/users/<username> - 删除用户 (DELETE)",
                "/api/users/<username> - 更新用户 (PUT)"
            ],
            "违规信息": [
                "/api/violations - 获取违规数据",
                "/api/user-violations - 获取用户违规数据"
            ],
            "海洋生物识别": [
                "/api/identify-marine-life - 上传图片进行海洋生物识别 (POST)"
            ],
            "预测": [
                "/api/predict-length - 预测长度 (POST)"
            ],
            "数据导出": [
                "/api/export/water-quality - 导出水质数据 (GET)",
                "/api/export/fish-data - 导出鱼类数据 (GET)", 
                "/api/export/species-data - 导出特定品种鱼类数据 (GET)",
                "/api/export/users - 导出用户数据 (GET)",
                "/api/export/comprehensive-report - 导出综合报告 (GET)"
            ],
            "数据上传": [
                "/api/upload/data - 上传单条或多条数据 (POST)",
                "/api/upload/csv - 批量上传CSV数据 (POST)"
            ],
            "数据查看": [
                "/api/recent-data - 获取最近上传的数据 (GET)"
            ]
        }
    })

# 数据库连接函数
def get_db_connection():
    return pymysql.connect(**DB_CONFIG)

def get_fish_statistics():
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM fishes")
        fish_data = cursor.fetchall()
    conn.close()
    
    # 将结果转换为DataFrame
    fish_df = pd.DataFrame(fish_data)
    
    # 如果数据库中有数据，使用数据库数据
    if not fish_df.empty:
        # 1. 各种鱼的数量统计
        species_count = fish_df['species'].value_counts().to_dict()
        
        # 2. 各种鱼的平均重量
        weight_avg = fish_df.groupby('species')['weight'].mean().to_dict()
        
        # 3. 鱼的长度与重量关系数据
        length_weight_data = fish_df[['species', 'length1', 'weight']].to_dict('records')
        
        # 4. 各种鱼的体型比例（长度/高度）
        proportion = (fish_df['length1'] / fish_df['height']).groupby(fish_df['species']).mean().to_dict()
        
        return {
            'species_count': species_count,
            'weight_avg': weight_avg,
            'length_weight': length_weight_data,
            'proportion': proportion
        }


# 水质监测数据API
@app.route('/api/water-quality', methods=['GET'])
def get_water_quality():
    try:
        # 获取查询参数
        year = request.args.get('year', '2020')
        month = request.args.get('month', '05')
        province = request.args.get('province')
        basin = request.args.get('basin')
        
        # 构建表名
        table_name = f"{year}-{month}"
        
        # 构建SQL查询
        sql = f"SELECT * FROM `{table_name}`"
        conditions = []
        
        if province:
            conditions.append(f"province = '{province}'")
        if basin:
            conditions.append(f"basin = '{basin}'")
        
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        
        # 查询数据库
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(sql)
            data = cursor.fetchall()
        conn.close()
        
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# 获取所有可用的年份和月份
@app.route('/api/water-quality/periods', methods=['GET'])
def get_available_periods():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
        conn.close()
        
        # 过滤出表示年月的表名 (格式: YYYY-MM)
        periods = []
        for table in tables:
            table_name = list(table.values())[0]  # 获取表名
            if len(table_name) == 7 and table_name[4] == '-':
                try:
                    year = int(table_name[:4])
                    month = int(table_name[5:])
                    if 2000 <= year <= 2100 and 1 <= month <= 12:
                        periods.append({"year": year, "month": month})
                except ValueError:
                    continue
        
        return jsonify({"success": True, "data": periods})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# 获取所有省份
@app.route('/api/water-quality/provinces', methods=['GET'])
def get_provinces():
    try:
        # 获取最新的表
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
        
        # 找到最新的水质表 (假设表名格式为 YYYY-MM)
        water_tables = []
        for table in tables:
            table_name = list(table.values())[0]
            if len(table_name) == 7 and table_name[4] == '-':
                water_tables.append(table_name)
        
        if not water_tables:
            return jsonify({"success": False, "error": "No water quality tables found"}), 404
        
        latest_table = sorted(water_tables)[-1]
        
        # 查询所有省份
        with conn.cursor() as cursor:
            cursor.execute(f"SELECT DISTINCT province FROM `{latest_table}`")
            provinces = [item['province'] for item in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({"success": True, "data": provinces})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# 获取所有流域
@app.route('/api/water-quality/basins', methods=['GET'])
def get_basins():
    try:
        # 获取最新的表
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
        
        # 找到最新的水质表 (假设表名格式为 YYYY-MM)
        water_tables = []
        for table in tables:
            table_name = list(table.values())[0]
            if len(table_name) == 7 and table_name[4] == '-':
                water_tables.append(table_name)
        
        if not water_tables:
            return jsonify({"success": False, "error": "No water quality tables found"}), 404
        
        latest_table = sorted(water_tables)[-1]
        
        # 过滤条件
        province = request.args.get('province')
        
        # 构建SQL查询
        sql = f"SELECT DISTINCT basin FROM `{latest_table}`"
        if province:
            sql += f" WHERE province = '{province}'"
        
        # 查询所有流域
        with conn.cursor() as cursor:
            cursor.execute(sql)
            basins = [item['basin'] for item in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({"success": True, "data": basins})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# 获取水质监测数据统计
@app.route('/api/water-quality/statistics', methods=['GET'])
def get_water_quality_stats():
    try:
        # 获取查询参数
        year = request.args.get('year', '2020')
        month = request.args.get('month', '05')
        
        # 构建表名
        table_name = f"{year}-{month}"
        
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 水质类别统计
            cursor.execute(f"SELECT water_quality_category, COUNT(*) as count FROM `{table_name}` GROUP BY water_quality_category")
            category_stats = cursor.fetchall()
            
            # 省份统计
            cursor.execute(f"SELECT province, COUNT(*) as count FROM `{table_name}` GROUP BY province")
            province_stats = cursor.fetchall()
            
            # 水质指标平均值
            cursor.execute(f"""
                SELECT 
                    AVG(water_temperature) as avg_temperature,
                    AVG(pH) as avg_ph,
                    AVG(dissolved_oxygen) as avg_oxygen,
                    AVG(conductivity) as avg_conductivity,
                    AVG(turbidity) as avg_turbidity,
                    AVG(permanganate_index) as avg_permanganate,
                    AVG(ammonia_nitrogen) as avg_ammonia,
                    AVG(total_phosphorus) as avg_phosphorus,
                    AVG(total_nitrogen) as avg_nitrogen,
                    AVG(chlorophyll_a) as avg_chlorophyll,
                    AVG(algae_density) as avg_algae
                FROM `{table_name}`
            """)
            metrics_avg = cursor.fetchone()
        
        conn.close()
        
        return jsonify({
            "success": True, 
            "data": {
                "categories": category_stats,
                "provinces": province_stats,
                "metrics_avg": metrics_avg
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# 读取市场数据


def update_market_data(item_name, quantity=None, price=None):
    global market_df
    if quantity is not None:
        market_df.loc[market_df['商品名称'] == item_name, '数量'] = quantity
    if price is not None:
        market_df.loc[market_df['商品名称'] == item_name, '单价'] = price
    market_df.to_csv('market_data.csv', index=False)
    return True

# API路由
@app.route('/api/fish-statistics', methods=['GET'])
def fish_statistics():
    try:
        data = get_fish_statistics()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/online-market', methods=['GET'])
def get_online_market():
    try:
        url = "http://www.xinfadi.com.cn/getPriceData.html"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.post(url, headers=headers)
        data = response.json()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/weather', methods=['GET'])
def get_weather():
    try:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": 52.52,
            "longitude": 13.41,
            "hourly": ["temperature_2m", "relative_humidity_2m"],
            "models": "cma_grapes_global"
        }
        response = requests.get(url, params=params)
        data = response.json()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/air-quality', methods=['GET'])
def get_air_quality():
    try:
        latitude = request.args.get('latitude')
        longitude = request.args.get('longitude')
        
        if not latitude or not longitude:
            return jsonify({
                "success": False,
                "error": "Missing required parameters: latitude and longitude"
            }), 400
        try:
            lat_list = [float(lat.strip()) for lat in latitude.split(',')]
            lng_list = [float(lng.strip()) for lng in longitude.split(',')]
        except ValueError:
            return jsonify({
                "success": False,
                "error": "Invalid coordinate format. Must be comma-separated float values"
            }), 400
        if len(lat_list) != len(lng_list):
            return jsonify({
                "success": False,
                "error": "Mismatched number of latitude and longitude values"
            }), 400

        for lat in lat_list:
            if not (-90 <= lat <= 90):
                return jsonify({
                    "success": False,
                    "error": f"Invalid latitude value: {lat}. Must be between -90 and 90"
                }), 400
        
        for lng in lng_list:
            if not (-180 <= lng <= 180):
                return jsonify({
                    "success": False,
                    "error": f"Invalid longitude value: {lng}. Must be between -180 and 180"
                }), 400
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "forecast_days": 4,  # 固定为4天
            "hourly": "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone"
        }
        excluded_params = {'latitude', 'longitude', 'forecast_days'}
        for key, value in request.args.items():
            if key not in excluded_params:
                params[key] = value

        url = "https://air-quality-api.open-meteo.com/v1/air-quality"
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if len(lat_list) > 1 and isinstance(data.get('hourly'), dict):
            data['metadata'] = {
                'locations': [
                    {'latitude': lat, 'longitude': lng, 'location_id': i}
                    for i, (lat, lng) in enumerate(zip(lat_list, lng_list))
                ]
            }
        return jsonify({
            "success": True,
            "data": data,
            "params": {
                "latitude": latitude,
                "longitude": longitude,
                "forecast_days": 4
            }
        })

    except requests.exceptions.RequestException as e:
        return jsonify({
            "success": False,
            "error": f"API request failed: {str(e)}",
            "details": f"URL: {e.request.url}" if hasattr(e, 'request') else None
        }), 502
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Unexpected error: {str(e)}"
        }), 500



@app.route('/api/video/<filename>')
def get_video(filename):
    try:
        video_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'videos')
        return send_from_directory(video_dir, filename)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/register', methods=['POST'])
def register():
    app.logger.debug(f"--- Entering /api/register ---") # 标记进入特定路由
    app.logger.debug(f"Register request headers: {request.headers}")
    app.logger.debug(f"Register request origin: {request.origin}")
    app.logger.debug(f"Register request data: {request.data}")
    data = request.get_json()

    # 获取用户输入的注册信息
    username = data.get('username')
    password = data.get('password')
    gender = data.get('gender')
    age = data.get('age')
    role = data.get('role')
    unit = data.get('unit')

    # 检查必填字段是否存在
    if not all([username, password, gender, age, role, unit]):
        return jsonify({"success": False, "error": "请提供完整的用户信息"}), 400
    
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 检查用户名是否已经存在
            cursor.execute("SELECT username FROM users WHERE username = %s", (username,))
            if cursor.fetchone():
                return jsonify({"success": False, "error": "用户名已存在"}), 400
            
            # 创建新用户
            cursor.execute(
                "INSERT INTO users (username, password, gender, age, role, unit) VALUES (%s, %s, %s, %s, %s, %s)",
                (username, password, gender, age, role, unit)
            )
        
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "注册成功"}), 201
    except Exception as e:
        app.logger.error(f"Error during registration: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    app.logger.debug(f"--- Entering /api/login ---") # 标记进入特定路由
    app.logger.debug(f"Login request headers: {request.headers}")
    app.logger.debug(f"Login request origin: {request.origin}")
    app.logger.debug(f"Login request data: {request.data}")
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"success": False, "error": "缺少用户名或密码"}), 400
    
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 查找用户
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
        
        conn.close()
        
        if not user:
            return jsonify({"success": False, "error": "用户名不存在"}), 400
        
        # 检查密码是否正确
        if user['password'] != password:
            return jsonify({"success": False, "error": "密码错误"}), 400

        return jsonify({
            "success": True,
            "message": "登录成功",
            "user": {
                "username": user['username'],
                "gender": user['gender'],
                "age": user['age'],
                "role": user['role'],
                "unit": user['unit']
            }
        }), 200
    except Exception as e:
        app.logger.error(f"Error during registration: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT username, gender, age, role, unit FROM users")
            users = cursor.fetchall()
        conn.close()
        
        return jsonify({"success": True, "data": users})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/users/<string:username>', methods=['DELETE'])
def delete_user(username):
    operator = request.get_json(force=True)  # 获取操作用户的信息
    if not operator or operator.get('role') != 'admin':
        return jsonify({"success": False, "message": "权限不足，只有管理员可以删除用户"}), 403

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 根据用户名查找用户
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({"success": False, "message": "用户未找到"}), 404
            
            if user['role'] == 'admin':  # 不允许删除管理员账号
                return jsonify({"success": False, "message": "不能删除管理员账号"}), 403
            
            # 删除用户
            cursor.execute("DELETE FROM users WHERE username = %s", (username,))
        
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": "用户已删除"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/users/<string:username>', methods=['PUT'])
def update_user(username):
    data = request.json
    operator_role = data.get("operator_role")  # 获取操作用户的角色

    if operator_role != "admin":
        return jsonify({"success": False, "message": "权限不足，只有管理员可以修改用户信息"}), 403

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 根据用户名查找用户
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({"success": False, "message": "用户未找到"}), 404
            
            # 更新用户信息
            cursor.execute(
                """UPDATE users 
                   SET username = %s, gender = %s, age = %s, role = %s, unit = %s 
                   WHERE username = %s""",
                (
                    data.get("username", user["username"]),
                    data.get("gender", user["gender"]),
                    data.get("age", user["age"]),
                    data.get("role", user["role"]),
                    data.get("unit", user["unit"]),
                    username
                )
            )
        
        conn.commit()
        
        # 获取更新后的用户数据
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE username = %s", (data.get("username", username),))
            updated_user = cursor.fetchone()
        
        conn.close()
        
        return jsonify({
            "success": True, 
            "message": "用户信息已更新", 
            "user": {
                "username": updated_user["username"],
                "gender": updated_user["gender"],
                "age": updated_user["age"],
                "role": updated_user["role"],
                "unit": updated_user["unit"]
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/get_user/<username>', methods=['GET'])
def get_user(username):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT username, gender, age, role, unit FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
        conn.close()
        
        if user:
            return jsonify({"success": True, "user": user})
        else:
            return jsonify({"success": False, "message": "用户未找到"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

def load_data(file_path):
    data = []
    with open(file_path, 'r') as f:
        for line in f:
            parts = line.strip().split(', ')
            if len(parts) == 3:
                try:
                    values = list(map(float, parts))
                    data.append(values)
                except ValueError:
                    print(f"跳过无效行: {line.strip()}")
    return np.array(data)

@app.route('/api/predict-length', methods=['POST'])
def predict_length():
    try:
        data = request.get_json()
        input_periods = data.get('periods')
        
        if not input_periods or len(input_periods) != 3:
            return jsonify({
                "success": False,
                "error": "请提供三个周期的数据"
            }), 400

        # 加载历史数据
        try:
            file_path = os.path.join(os.path.dirname(__file__), 'output.txt')
            training_data = load_data(file_path)
            
            if training_data.size == 0:
                return jsonify({
                    "success": False,
                    "error": "无法加载训练数据"
                }), 500
                
            # 构建训练数据
            X = training_data[:, :2]  # 使用前两个周期作为特征
            y = training_data[:, 2]   # 使用第三个周期作为目标
            
            # 创建并训练模型
            model = LinearRegression()
            model.fit(X, y)
            
            # 使用用户输入的数据进行预测
            input_features = np.array(input_periods[:2]).reshape(1, -1)
            predicted_length = model.predict(input_features)[0]
            
            # 确保预测结果合理
            min_growth = 1.0
            max_growth = 1.5
            last_period = input_periods[-1]
            
            if predicted_length < last_period * min_growth:
                predicted_length = last_period * min_growth
            elif predicted_length > last_period * max_growth:
                predicted_length = last_period * max_growth

            return jsonify({
                "success": True,
                "data": {
                    "predicted_length": float(predicted_length),
                    "current_length": float(last_period)
                }
            })
            
        except FileNotFoundError:
            return jsonify({
                "success": False,
                "error": "训练数据文件不存在"
            }), 500

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

def get_status(value, indicator):
    if value is None:
        return 'unknown'
    
    if indicator == 'dissolved_oxygen':
        return 'good' if value >= 5 else 'warning' if value >= 3 else 'danger'
    elif indicator == 'ammonia_nitrogen':
        return 'good' if value <= 0.5 else 'warning' if value <= 1.0 else 'danger'
    elif indicator == 'ph':
        return 'good' if 6.5 <= value <= 8.5 else 'warning' if 6.0 <= value <= 9.0 else 'danger'
    elif indicator == 'total_phosphorus':
        return 'good' if value <= 0.1 else 'warning' if value <= 0.2 else 'danger'
    elif indicator == 'temperature':
        return 'good' if value <= 30 else 'warning' if value <= 35 else 'danger'
    else:
        return 'unknown'

@app.route('/api/water-quality/current', methods=['GET'])
def get_current_status():
    try:
        year = request.args.get('year', '2025')
        month = request.args.get('month', '05')
        province = request.args.get('province')
        basin = request.args.get('basin')
        section_name = request.args.get('section_name')

        table_name = f"{year}-{month}"

        # 构造SQL语句
        sql = f"""
            SELECT dissolved_oxygen, ammonia_nitrogen, pH, total_phosphorus, water_temperature
            FROM `{table_name}`
        """
        conditions = []

        if province:
            conditions.append(f"province = %s")
        if basin:
            conditions.append(f"basin = %s")
        if section_name:
            conditions.append(f"section_name = %s")
        
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        sql += " ORDER BY monitor_time DESC LIMIT 1"
        

        # 构建参数列表
        params = []
        if province:
            params.append(province)
        if basin:
            params.append(basin)
            
        if section_name:
            params.append(section_name)

        # 查询数据库
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(sql, params)
            row = cursor.fetchone()
        conn.close()

        if not row:
            return jsonify({"success": False, "error": "No data found"}), 404

        result = {
            "dissolved_oxygen": {
                "value": row['dissolved_oxygen'],
                "status": get_status(row['dissolved_oxygen'], 'dissolved_oxygen'),
                "unit": "mg/L"
            },
            "ammonia_nitrogen": {
                "value": row['ammonia_nitrogen'],
                "status": get_status(row['ammonia_nitrogen'], 'ammonia_nitrogen'),
                "unit": "mg/L"
            },
            "ph": {
                "value": row['pH'],
                "status": get_status(row['pH'], 'ph'),
                "unit": ""
            },
            "total_phosphorus": {
                "value": row['total_phosphorus'],
                "status": get_status(row['total_phosphorus'], 'total_phosphorus'),
                "unit": "mg/L"
            },
            "temperature": {
                "value": row['water_temperature'],
                "status": get_status(row['water_temperature'], 'temperature'),
                "unit": "°C"
            }
        }

        return jsonify({"success": True, "data": result})

    except Exception as e:
        app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
    
@app.route('/api/water-quality/province-basin-sectionname-list', methods=['GET'])
def get_province_basin_sectionname_list():
    try:
        year = request.args.get('year', '2025')
        month = request.args.get('month', '05')
        table_name = f"{year}-{month}"

        sql = f"""
            SELECT DISTINCT province, basin,section_name
            FROM `{table_name}`
            ORDER BY province, basin,section_name
        """
        app.logger.info(f"Executing SQL: {sql}") 
          
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(sql)
            rows = cursor.fetchall()
        conn.close()
        app.logger.info(f"Query result: {rows}")  
        
        if not rows:
            app.logger.error("No data found")
            return jsonify({"success": False, "error": "No data found"}), 404

        # 构建返回结果
        result = [{"province": row["province"], "basin": row["basin"],"section_name":row["section_name"]} for row in rows]  # 使用字段名访问数据
        return jsonify({"success": True, "data": result})

    except Exception as e:
        app.logger.error(f"Error during query execution: {str(e)}")
        app.logger.error(f"Query result: {rows}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/water-quality/province-basin-list', methods=['GET'])
def get_province_basin_list():
    try:
        year = request.args.get('year', '2025')
        month = request.args.get('month', '05')
        table_name = f"{year}-{month}"
        sql = f"""
            SELECT DISTINCT province, basin
            FROM `{table_name}`
            ORDER BY province, basin
        """
        app.logger.info(f"Executing SQL: {sql}")  # 打印 SQL 查询日志
          
        # 连接数据库并执行查询
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(sql)
            rows = cursor.fetchall()
        conn.close()
        app.logger.info(f"Query result: {rows}")  # 打印查询结果
        
        if not rows:
            app.logger.error("No data found")
            return jsonify({"success": False, "error": "No data found"}), 404

        # 构建返回结果
        result = [{"province": row["province"], "basin": row["basin"]} for row in rows]  # 使用字段名访问数据
        return jsonify({"success": True, "data": result})

    except Exception as e:
        app.logger.error(f"Error during query execution: {str(e)}")
        app.logger.error(f"Query result: {rows}")
        return jsonify({"success": False, "error": str(e)}), 500
    

@app.route('/api/fishes/species-list', methods=['GET'])
def get_fish_species_list():
    try:
        # 连接数据库并执行查询
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 查询所有不重复的鱼类品种
            sql = """
                SELECT DISTINCT species
                FROM `fishes`
                ORDER BY species
            """
            app.logger.info(f"Executing SQL: {sql}") 
            
            cursor.execute(sql)
            rows = cursor.fetchall()
        conn.close()
        app.logger.info(f"Query result: {rows}")  
        
        if not rows:
            app.logger.error("No fish species found")
            return jsonify({"success": False, "error": "No fish species found"}), 404

        # 构建返回结果（直接提取species字段值）
        result = [row["species"] for row in rows]  # 使用字段名访问数据
        return jsonify({"success": True, "data": result})

    except Exception as e:
        app.logger.error(f"Error during query execution: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/fishes/species-data', methods=['GET'])
def get_fish_species_data():
    conn = None
    try:
        species = request.args.get('species')
        if not species:
            return jsonify({"success": False, "error": "Species parameter is required"}), 400

        # 获取数据库连接
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT 
                    species,
                    weight,
                    length1,
                    length2,
                    length3,
                    height,
                    width
                FROM fishes 
                WHERE species = %s
            """
            app.logger.info(f"Executing SQL: {sql} with species: {species}")
            cursor.execute(sql, (species,))
            rows = cursor.fetchall()

        if not rows:
            return jsonify({"success": False, "error": f"No data found for species: {species}"}), 404

        # 计算平均值
        def safe_mean(values):
            clean_values = [v for v in values if v is not None]
            return round(sum(clean_values)/len(clean_values), 2) if clean_values else None

        averages = {
            "weight": safe_mean([r['weight'] for r in rows]),
            "length1": safe_mean([r['length1'] for r in rows]),
            "length2": safe_mean([r['length2'] for r in rows]),
            "length3": safe_mean([r['length3'] for r in rows]),
            "height": safe_mean([r['height'] for r in rows]),
            "width": safe_mean([r['width'] for r in rows]),
            "record_count": len(rows)
        }

        return jsonify({
            "success": True,
            "species": species,
            "records": rows,
            "averages": averages,
            "units": {
                "weight": "grams",
                "length": "cm",
                "height": "cm",
                "width": "cm"
            }
        })

    except Exception as e:
        app.logger.error(f"Error during query execution: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if conn and conn.open:  # 只有连接存在且未关闭时才关闭
            try:
                conn.close()
            except Exception as e:
                app.logger.warning(f"Error closing connection: {str(e)}")
    

@app.route('/api/water-quality/current_data', methods=['GET'])
def get_current_data():
    try:
        year = request.args.get('year', '2025')
        month = request.args.get('month', '05')
        province = request.args.get('province')
        basin = request.args.get('basin')

        table_name = f"{year}-{month}"

        # 构造SQL语句
        sql = f"""
            SELECT dissolved_oxygen, ammonia_nitrogen, pH, total_phosphorus, water_temperature, section_name
            FROM `{table_name}`
        """
        conditions = []

        if province:
            conditions.append("province = %s")
        if basin:
            conditions.append("basin = %s")

        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        sql += " ORDER BY monitor_time DESC"

        # 构建参数列表
        params = []
        if province:
            params.append(province)
        if basin:
            params.append(basin)

        app.logger.info(f"SQL Query: {sql}")
        app.logger.info(f"Params: {params}")

        # 查询数据库
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(sql, params)
            rows = cursor.fetchall()  # 获取所有的结果
        conn.close()

        app.logger.info(f"Query result: {rows}")

        if not rows:
            return jsonify({"success": False, "error": "No data found"}), 404
        
        # 将多个记录格式化为字典列表
        results = []
        for row in rows:
            app.logger.info(f"Row: {row}")
            result = {
                "dissolved_oxygen": row['dissolved_oxygen'],
                "ammonia_nitrogen": row['ammonia_nitrogen'],
                "ph": row['pH'],
                "total_phosphorus": row['total_phosphorus'],
                "temperature": row['water_temperature'],
                "section_name": row['section_name']
            }
            results.append(result)

        return jsonify({"success": True, "data": results})

    except Exception as e:
        app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
    

@app.route('/api/fishes/weight-stats', methods=['GET'])
def get_fish_weight_stats():
    conn = None
    try:
        species = request.args.get('species')
        if not species:
            return jsonify({"success": False, "error": "Species parameter is required"}), 400

        # 初始化结果结构
        result = {
            "success": True,
            "species": species,
            "weight_distribution": {
                "<100g": 0,
                "100-300g": 0,
                "300-500g": 0,
                "500-700g": 0,
                "700-1000g": 0,
                "1000-1500g": 0,
                ">1500g": 0
            },
            "total_count": 0,
            "unit": "grams",
            "chart_data": []
        }

        sql = """
            SELECT 
                COALESCE(SUM(CASE WHEN weight < 100 THEN 1 ELSE 0 END), 0) AS under_100,
                COALESCE(SUM(CASE WHEN weight >= 100 AND weight < 300 THEN 1 ELSE 0 END), 0) AS _100_to_300,
                COALESCE(SUM(CASE WHEN weight >= 300 AND weight < 500 THEN 1 ELSE 0 END), 0) AS _300_to_500,
                COALESCE(SUM(CASE WHEN weight >= 500 AND weight < 700 THEN 1 ELSE 0 END), 0) AS _500_to_700,
                COALESCE(SUM(CASE WHEN weight >= 700 AND weight < 1000 THEN 1 ELSE 0 END), 0) AS _700_to_1000,
                COALESCE(SUM(CASE WHEN weight >= 1000 AND weight < 1500 THEN 1 ELSE 0 END), 0) AS _1000_to_1500,
                COALESCE(SUM(CASE WHEN weight >= 1500 THEN 1 ELSE 0 END), 0) AS over_1500,
                COALESCE(COUNT(*), 0) AS total_count
            FROM fishes 
            WHERE species = %s
        """

        app.logger.info(f"Executing SQL: {sql} with species: {species}")

        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(sql, (species,))
            row = cursor.fetchone()

            if not row:
                return jsonify({"success": False, "error": f"No data found for species: {species}"}), 404

            # 处理查询结果，确保所有值都是整数
            processed_row = {}
            for key, value in row.items():
                # 处理可能的None值
                if value is None:
                    processed_row[key] = 0
                # 处理数值类型（包括Decimal和普通数字）
                elif isinstance(value, (int, float)):
                    processed_row[key] = int(value)
                # 尝试将其他类型转换为整数
                else:
                    try:
                        processed_row[key] = int(value)
                    except (ValueError, TypeError):
                        processed_row[key] = 0
                        app.logger.warning(f"Failed to convert {key} value: {value}")

            # 映射数据库字段到前端显示名称
            weight_mapping = {
                "under_100": "<100g",
                "_100_to_300": "100-300g",
                "_300_to_500": "300-500g",
                "_500_to_700": "500-700g",
                "_700_to_1000": "700-1000g",
                "_1000_to_1500": "1000-1500g",
                "over_1500": ">1500g"
            }

            # 填充体重分布数据
            for db_key, display_key in weight_mapping.items():
                result["weight_distribution"][display_key] = processed_row[db_key]

            # 设置总记录数
            result["total_count"] = processed_row["total_count"]

            # 生成饼图数据（过滤掉数量为0的区间）
            result["chart_data"] = [
                {"name": display_key, "value": count}
                for db_key, display_key in weight_mapping.items()
                if (count := processed_row[db_key]) > 0
            ]
        print(result)
        return jsonify(result)
       

    except Exception as e:
        app.logger.error(f"Error in get_fish_weight_stats: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Internal server error"}), 500
    finally:
        if conn:
            try:
                conn.close()
            except Exception as e:
                app.logger.warning(f"Error closing connection: {str(e)}")


@app.route('/api/water-quality/category-statistics', methods=['GET'])
def get_quality_category_statistics():
    try:
        year = request.args.get('year', '2025')
        month = request.args.get('month', '05')
        province = request.args.get('province')
        basin = request.args.get('basin')

        table_name = f"{year}-{month}"

        # 构造SQL语句
        sql = f"""
            SELECT water_quality_category, COUNT(*) as count
            FROM `{table_name}`
            WHERE water_quality_category IS NOT NULL
        """
        conditions = []

        if province:
            conditions.append("province = %s")
        if basin:
            conditions.append("basin = %s")

        if conditions:
            sql += " AND " + " AND ".join(conditions)
        sql += " GROUP BY water_quality_category"

        # 构建参数列表
        params = []
        if province:
            params.append(province)
        if basin:
            params.append(basin)

        app.logger.info(f"SQL Query: {sql}")
        app.logger.info(f"Params: {params}")

        # 查询数据库
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(sql, params)
            rows = cursor.fetchall()
        conn.close()

        app.logger.info(f"Query result: {rows}")

        # 初始化统计字典
        category_counts = {
            "Ⅰ": 0,
            "Ⅱ": 0,
            "Ⅲ": 0,
            "Ⅳ": 0,
            "Ⅴ": 0,
            "劣Ⅴ": 0
        }

        for row in rows:
            category = row['water_quality_category']
            count = row['count']
            if category in category_counts:
                category_counts[category] = count
            else:
                app.logger.warning(f"Unexpected category: {category}")

        return jsonify({"success": True, "data": category_counts})

    except Exception as e:
        app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500



@app.route('/api/water-quality/full_data', methods=['GET'])
def get_full_data():
    try:
        year = request.args.get('year', '2025')
        month = request.args.get('month', '05')
        province = request.args.get('province')
        basin = request.args.get('basin')

        table_name = f"{year}-{month}"

        sql = f"SELECT * FROM `{table_name}`"
        conditions = []
        params = []

        if province:
            conditions.append("province = %s")
            params.append(province)
        if basin:
            conditions.append("basin = %s")
            params.append(basin)

        if conditions:
            sql += " WHERE " + " AND ".join(conditions)

        sql += " ORDER BY monitor_time DESC"

        app.logger.info(f"Executing SQL: {sql}")
        app.logger.info(f"SQL Parameters: {params}")

        conn = get_db_connection()
        with conn.cursor(DictCursor) as cursor:  
            cursor.execute(sql, params)
            rows = cursor.fetchall()
        conn.close()

        # 检查是否误把表头写进了数据表中
        if rows and list(rows[0].keys()) == list(rows[0].values()):
            app.logger.warning("Detected header row inside data rows. Removing the first row.")
            rows = rows[1:]

        if not rows:
            return jsonify({"success": False, "error": "No data found"}), 404

        data = []
        for row in rows:
            app.logger.info(f"Processing row: {row}")
            row_data = {}
            try:
                for column_name, value in row.items():
                    app.logger.info(f"Processing field: {column_name} with value: {value} ({type(value)})")

                    if isinstance(value, datetime.datetime):
                        value = value.isoformat()
                    elif value is None:
                        value = "N/A"
                    elif isinstance(value, float):
                        value = round(value, 2)

                    row_data[column_name] = value

                data.append(row_data)

            except Exception as e:
                app.logger.error(f"Error processing row: {row} - Error: {str(e)}")
                continue

        return jsonify({"success": True, "data": data})

    except Exception as e:
        app.logger.error(f"Error fetching full data: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

# 获取本机无线局域网适配器IP地址
def get_wlan_ip():
    try:
        # 使用Windows命令获取网络信息
        result = subprocess.check_output("ipconfig", shell=True, text=True)
        
        # 查找WLAN适配器信息
        wlan_section = re.search(r"无线局域网适配器 (WLAN|Wi-Fi)([\s\S]*?)(\r?\n\r?\n|\Z)", result)
        if not wlan_section:
            # 尝试查找英文版本的适配器名称
            wlan_section = re.search(r"Wireless LAN adapter (WLAN|Wi-Fi)([\s\S]*?)(\r?\n\r?\n|\Z)", result)
        
        if wlan_section:
            # 从WLAN部分查找IPv4地址
            ip_match = re.search(r"IPv4 地址[\.\s]*: ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)", wlan_section.group(0))
            if not ip_match:
                # 尝试查找英文版本
                ip_match = re.search(r"IPv4 Address[\.\s]*: ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)", wlan_section.group(0))
            
            if ip_match:
                return ip_match.group(1)
    except Exception as e:
        app.logger.error(f"Error getting WLAN IP: {e}")
    
    # 如果上述方法失败，尝试使用socket获取本机IP
    try:
        # 创建一个临时socket连接到公网，以获取当前使用的网络接口IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception as e:
        app.logger.error(f"Socket method failed: {e}")
        return "127.0.0.1"  # 如果所有方法都失败，返回localhost

# 存储获取到的IP地址
SERVER_IP = get_wlan_ip()
SERVER_PORT = 5000
SERVER_URL = f"http://{SERVER_IP}:{SERVER_PORT}"

app.logger.info(f"Server IP detected: {SERVER_IP}")
app.logger.info(f"Server URL: {SERVER_URL}")

# 添加API端点返回服务器地址信息
@app.route('/api/server-info', methods=['GET'])
def get_server_info():
    return jsonify({
        "success": True,
        "ip": SERVER_IP,
        "port": SERVER_PORT,
        "url": SERVER_URL
    })

@app.route('/api/geocode/city-code', methods=['GET'])
def get_city_code():
    try:
        # 调试日志：打印原始参数
        app.logger.debug(f"接收到的原始参数: {request.args}")
        
        # 参数获取与验证
        key = request.args.get('key', '').strip()
        address = request.args.get('address', '').strip()
        
        if not key or not address:
            app.logger.error(f"参数验证失败: key={key}, address={address}")
            return jsonify({
                "success": False,
                "error": "参数key和address必须提供",
                "received": request.args.to_dict()
            }), 400

        # 调用高德API
        amap_url = "https://restapi.amap.com/v3/geocode/geo"
        try:
            response = requests.get(
                amap_url,
                params={'key': key, 'address': address},
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            app.logger.error(f"高德API请求失败: {str(e)}")
            return jsonify({
                "success": False,
                "error": "地图服务请求失败",
                "details": str(e)
            }), 502

        # 处理高德API响应
        if data.get('status') != '1':
            app.logger.error(f"高德API错误响应: {data}")
            return jsonify({
                "success": False,
                "error": data.get('info', '地址解析服务错误'),
                "amap_response": data
            }), 400

        if not data.get('geocodes'):
            return jsonify({
                "success": False,
                "error": "未找到匹配的地址信息"
            }), 404

        # 成功响应
        return jsonify({
            "success": True,
            "data": {
                "city_code": data['geocodes'][0]['adcode'],
                "formatted_address": data['geocodes'][0]['formatted_address']
            }
        })

    except Exception as e:
        app.logger.error(f"未处理的异常: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "服务器内部错误",
            "exception": str(e)
        }), 500

@app.route('/api/weather/amap', methods=['GET'])
def get_amap_weather():

    # 参数接收与验证
    params = {
        'key': request.args.get('key', '').strip(),
        'city_code': request.args.get('city_code', '').strip(),
        'extensions': request.args.get('extensions', 'all').strip().lower()
    }
    
    # 参数验证
    if not all(params.values()):
        missing = [k for k, v in params.items() if not v]
        app.logger.error(f"缺少必要参数: {missing}")
        return jsonify({
            "success": False,
            "error": f"缺少必要参数: {', '.join(missing)}",
            "received": request.args.to_dict()
        }), 400

    if not params['city_code'].isdigit():
        app.logger.error(f"无效城市编码格式: {params['city_code']}")
        return jsonify({
            "success": False,
            "error": "城市编码必须为数字",
            "received": params['city_code']
        }), 400

    if params['extensions'] not in ['base', 'all']:
        app.logger.error(f"无效extensions参数: {params['extensions']}")
        return jsonify({
            "success": False,
            "error": "extensions必须是base或all",
            "received": params['extensions']
        }), 400

    # 构建高德API请求
    amap_params = {
        'key': params['key'],
        'city': params['city_code'],
        'extensions': params['extensions'],
        'output': 'JSON'
    }

    try:
        # 调用高德API
        response = requests.get(
            "https://restapi.amap.com/v3/weather/weatherInfo",
            params=amap_params,
            timeout=(3.05, 10)  # 连接超时3.05秒，读取超时10秒
        )
        response.raise_for_status()
        amap_data = response.json()
        
        # 处理高德API响应
        if amap_data.get('status') != '1':
            error_info = amap_data.get('info', '未知错误')
            app.logger.error(f"高德API错误: {error_info}")
            return jsonify({
                "success": False,
                "error": f"高德接口返回错误: {error_info}",
                "amap_response": amap_data
            }), 502

        # 数据标准化处理
        result = {
            "success": True,
            "data": {
                "report_time": amap_data.get("reportTime", ""),
                "city_info": {
                    "code": params['city_code'],
                    "name": get_city_name(amap_data, params['extensions'])
                },
                "weather": parse_weather_data(amap_data, params['extensions'])
            },
            "metadata": {
                "request_id": request.headers.get('X-Request-ID'),
                "timestamp": datetime.datetime.now().isoformat()
            }
        }

        app.logger.info(f"成功获取天气数据: {params['city_code']}")
        return jsonify(result)

    except requests.exceptions.Timeout:
        app.logger.error("请求高德API超时")
        return jsonify({
            "success": False,
            "error": "连接天气服务超时"
        }), 504
    except requests.exceptions.RequestException as e:
        app.logger.error(f"高德API请求异常: {str(e)}")
        return jsonify({
            "success": False,
            "error": "天气服务不可用",
            "details": str(e)
        }), 502
    except Exception as e:
        app.logger.error(f"未处理异常: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "服务器处理请求时出错",
            "exception": str(e)
        }), 500


def get_city_name(amap_data, extensions):
    """获取城市名称"""
    if extensions == 'base':
        return amap_data.get("lives", [{}])[0].get("city", "未知城市")
    return amap_data.get("forecasts", [{}])[0].get("city", "未知城市")


def parse_weather_data(amap_data, extensions):
    """解析天气数据"""
    if extensions == 'base':
        live = amap_data.get("lives", [{}])[0]
        return {
            "type": "live",
            "weather": live.get("weather"),
            "temperature": live.get("temperature"),
            "wind": {
                "direction": live.get("winddirection"),
                "power": live.get("windpower")
            },
            "humidity": live.get("humidity")
        }
    
    forecast = amap_data.get("forecasts", [{}])[0]
    return {
        "type": "forecast",
        "casts": [
            {
                "date": cast.get("date"),
                "day": {
                    "weather": cast.get("dayweather"),
                    "temp": cast.get("daytemp"),
                    "wind": cast.get("daywind"),
                    "power": cast.get("daypower")
                },
                "night": {
                    "weather": cast.get("nightweather"),
                    "temp": cast.get("nighttemp"),
                    "wind": cast.get("nightwind"),
                    "power": cast.get("nightpower")
                }
            } for cast in forecast.get("casts", [])
        ]
    }

@app.route('/api/geocode/city-lnglat', methods=['GET'])
def get_city_lnglat():
    try:
        key = request.args.get('key', '').strip()
        city_code = request.args.get('city_code', '').strip()

        if not key or not city_code:
            app.logger.error(f"参数验证失败: key={key}, city_code={city_code}")
            return jsonify({
                "success": False,
                "error": "参数key和city_code必须提供",
                "received": request.args.to_dict()
            }), 400

        # 调用高德行政区查询API
        amap_url = "https://restapi.amap.com/v3/config/district"
        try:
            response = requests.get(
                amap_url,
                params={
                    'key': key,
                    'keywords': city_code,
                    'subdistrict': 0,
                    'extensions': 'base'
                },
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            app.logger.error(f"高德API请求失败: {str(e)}")
            return jsonify({
                "success": False,
                "error": "地图服务请求失败",
                "details": str(e)
            }), 502

        if data.get('status') != '1' or not data.get('districts'):
            app.logger.error(f"高德API错误响应: {data}")
            return jsonify({
                "success": False,
                "error": data.get('info', '行政区查询服务错误'),
                "amap_response": data
            }), 400

        district = data['districts'][0]
        # 中心点格式为 "经度,纬度"
        center = district.get('center', '')
        if not center or ',' not in center:
            return jsonify({
                "success": False,
                "error": "未找到该城市的经纬度信息"
            }), 404

        lng, lat = center.split(',')

        return jsonify({
            "success": True,
            "data": {
                "city_code": city_code,
                "name": district.get('name', ''),
                "longitude": float(lng),
                "latitude": float(lat)
            }
        })

    except Exception as e:
        app.logger.error(f"未处理的异常: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "服务器内部错误",
            "exception": str(e)
        }), 500

# 数据导出相关API
@app.route('/api/export/water-quality', methods=['GET'])
def export_water_quality():
    """导出水质监测数据"""
    try:
        # 获取查询参数
        year = request.args.get('year', '2020')
        month = request.args.get('month', '05')
        province = request.args.get('province')
        basin = request.args.get('basin')
        export_format = request.args.get('format', 'csv').lower()
        
        # 构建表名
        table_name = f"{year}-{month}"
        
        # 构建SQL查询
        sql = f"SELECT * FROM `{table_name}`"
        conditions = []
        
        if province:
            conditions.append(f"province = '{province}'")
        if basin:
            conditions.append(f"basin = '{basin}'")
        
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        
        # 查询数据库
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(sql)
            data = cursor.fetchall()
        conn.close()
        
        if not data:
            return jsonify({"success": False, "error": "没有找到数据"}), 404
        
        # 转换为DataFrame
        df = pd.DataFrame(data)
        
        # 生成文件名
        filename_prefix = f"water_quality_{year}_{month}"
        if province:
            filename_prefix += f"_{province}"
        if basin:
            filename_prefix += f"_{basin}"
        
        # 根据格式导出
        if export_format == 'excel' or export_format == 'xlsx':
            filename = f"{filename_prefix}.xlsx"
            output = df.to_excel(filename, index=False, engine='openpyxl')
            return send_file(
                filename,
                as_attachment=True,
                download_name=filename,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        else:  # CSV格式
            filename = f"{filename_prefix}.csv"
            df.to_csv(filename, index=False, encoding='utf-8-sig')
            return send_file(
                filename,
                as_attachment=True,
                download_name=filename,
                mimetype='text/csv'
            )
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/export/fish-data', methods=['GET'])
def export_fish_data():
    """导出鱼类数据"""
    try:
        export_format = request.args.get('format', 'csv').lower()
        
        # 查询鱼类数据
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM fishes")
            data = cursor.fetchall()
        conn.close()
        
        if not data:
            return jsonify({"success": False, "error": "没有找到鱼类数据"}), 404
        
        # 转换为DataFrame
        df = pd.DataFrame(data)
        
        # 生成文件名
        filename_prefix = "fish_data"
        
        # 根据格式导出
        if export_format == 'excel' or export_format == 'xlsx':
            filename = f"{filename_prefix}.xlsx"
            df.to_excel(filename, index=False, engine='openpyxl')
            return send_file(
                filename,
                as_attachment=True,
                download_name=filename,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        else:  # CSV格式
            filename = f"{filename_prefix}.csv"
            df.to_csv(filename, index=False, encoding='utf-8-sig')
            return send_file(
                filename,
                as_attachment=True,
                download_name=filename,
                mimetype='text/csv'
            )
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/export/species-data', methods=['GET'])
def export_species_data():
    """导出特定品种的鱼类数据"""
    try:
        species = request.args.get('species')
        export_format = request.args.get('format', 'csv').lower()
        
        if not species:
            return jsonify({"success": False, "error": "请指定鱼类品种"}), 400
        
        # 查询特定品种的鱼类数据
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM fishes WHERE species = %s", (species,))
            data = cursor.fetchall()
        conn.close()
        
        if not data:
            return jsonify({"success": False, "error": f"没有找到{species}的数据"}), 404
        
        # 转换为DataFrame
        df = pd.DataFrame(data)
        
        # 生成文件名
        filename_prefix = f"{species}_data"
        
        # 根据格式导出
        if export_format == 'excel' or export_format == 'xlsx':
            filename = f"{filename_prefix}.xlsx"
            df.to_excel(filename, index=False, engine='openpyxl')
            return send_file(
                filename,
                as_attachment=True,
                download_name=filename,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        else:  # CSV格式
            filename = f"{filename_prefix}.csv"
            df.to_csv(filename, index=False, encoding='utf-8-sig')
            return send_file(
                filename,
                as_attachment=True,
                download_name=filename,
                mimetype='text/csv'
            )
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/export/users', methods=['GET'])
def export_users():
    """导出用户数据（仅管理员可用）"""
    try:
        export_format = request.args.get('format', 'csv').lower()
        
        # 这里应该添加权限检查，但为了简化，暂时跳过
        # 在实际应用中，应该验证用户的管理员权限
        
        # 查询用户数据
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 不导出密码字段
            cursor.execute("SELECT username, gender, age, role, unit FROM users")
            data = cursor.fetchall()
        conn.close()
        
        if not data:
            return jsonify({"success": False, "error": "没有找到用户数据"}), 404
        
        # 转换为DataFrame
        df = pd.DataFrame(data)
        
        # 生成文件名
        filename_prefix = "users_data"
        
        # 根据格式导出
        if export_format == 'excel' or export_format == 'xlsx':
            filename = f"{filename_prefix}.xlsx"
            df.to_excel(filename, index=False, engine='openpyxl')
            return send_file(
                filename,
                as_attachment=True,
                download_name=filename,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        else:  # CSV格式
            filename = f"{filename_prefix}.csv"
            df.to_csv(filename, index=False, encoding='utf-8-sig')
            return send_file(
                filename,
                as_attachment=True,
                download_name=filename,
                mimetype='text/csv'
            )
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/export/comprehensive-report', methods=['GET'])
def export_comprehensive_report():
    """导出综合分析报告"""
    try:
        print("=== 综合报告导出请求开始 ===")
        year = request.args.get('year', '2020')
        month = request.args.get('month', '05')
        export_format = request.args.get('format', 'pdf').lower()
        
        print(f"请求参数: year={year}, month={month}, format={export_format}")
        
        # 构建表名
        table_name = f"{year}-{month}"
        print(f"数据表名: {table_name}")
        
        if export_format == 'pdf':
            import os
            # 使用绝对路径确保文件能正确保存
            filename = os.path.join(os.getcwd(), f"comprehensive_report_{year}_{month}.pdf")
            print(f"PDF文件路径: {filename}")
            return generate_pdf_report(year, month, table_name, filename)
        
        elif export_format == 'excel' or export_format == 'xlsx':
            filename = f"comprehensive_report_{year}_{month}.xlsx"
            
            with pd.ExcelWriter(filename, engine='openpyxl') as writer:
                # 工作表1：水质原始数据
                conn = get_db_connection()
                with conn.cursor() as cursor:
                    cursor.execute(f"SELECT * FROM `{table_name}` LIMIT 1000")
                    water_data = cursor.fetchall()
                    
                if water_data:
                    water_df = pd.DataFrame(water_data)
                    water_df.to_excel(writer, sheet_name='水质原始数据', index=False)
                
                # 工作表2：水质统计数据
                with conn.cursor() as cursor:
                    cursor.execute(f"""
                        SELECT 
                            water_quality_category, 
                            COUNT(*) as count,
                            AVG(water_temperature) as avg_temperature,
                            AVG(pH) as avg_ph,
                            AVG(dissolved_oxygen) as avg_oxygen
                        FROM `{table_name}` 
                        GROUP BY water_quality_category
                    """)
                    stats_data = cursor.fetchall()
                    
                if stats_data:
                    stats_df = pd.DataFrame(stats_data)
                    stats_df.to_excel(writer, sheet_name='水质统计分析', index=False)
                
                # 工作表3：鱼类数据
                with conn.cursor() as cursor:
                    cursor.execute("SELECT * FROM fishes")
                    fish_data = cursor.fetchall()
                    
                if fish_data:
                    fish_df = pd.DataFrame(fish_data)
                    fish_df.to_excel(writer, sheet_name='鱼类数据', index=False)
                
                conn.close()
            
            return send_file(
                filename,
                as_attachment=True,
                download_name=filename,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        else:
            return jsonify({"success": False, "error": "支持的格式：pdf, excel"}), 400
            
    except Exception as e:
        import traceback
        error_msg = f"综合报告导出失败: {str(e)}"
        print("=== 综合报告导出错误 ===")
        print(f"错误信息: {error_msg}")
        print(f"错误类型: {type(e).__name__}")
        print(f"错误堆栈:\n{traceback.format_exc()}")
        print("========================")
        return jsonify({"success": False, "error": error_msg}), 500

def generate_pdf_report(year, month, table_name, filename):
    """生成包含实际数据和图表的PDF格式综合报告"""
    try:
        print(f"开始生成PDF报告: {filename}")
        
        # 导入所需库
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        import matplotlib.pyplot as plt
        import matplotlib
        matplotlib.use('Agg')  # 使用非交互式后端
        import seaborn as sns
        
        # 设置中文字体支持
        plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
        plt.rcParams['axes.unicode_minus'] = False
        
        print("开始获取数据...")
        
        # 1. 获取水质数据
        water_data = None
        water_stats = {}
        try:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                cursor.execute(f"SELECT * FROM `{table_name}` LIMIT 1000")
                water_data = cursor.fetchall()
            conn.close()
            
            if water_data:
                water_df = pd.DataFrame(water_data)
                print(f"获取到 {len(water_data)} 条水质数据")
                
                # 计算统计信息
                if 'water_quality_grade' in water_df.columns:
                    water_stats['grade_distribution'] = water_df['water_quality_grade'].value_counts().to_dict()
                if 'province' in water_df.columns:
                    water_stats['province_count'] = len(water_df['province'].unique())
                if 'basin' in water_df.columns:
                    water_stats['basin_count'] = len(water_df['basin'].unique())
                
                water_stats['total_records'] = len(water_data)
        except Exception as e:
            print(f"获取水质数据失败: {e}")
            water_data = []
        
        # 2. 获取鱼类数据
        fish_data = None
        fish_stats = {}
        try:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM fishes LIMIT 500")
                fish_data = cursor.fetchall()
            conn.close()
            
            if fish_data:
                fish_df = pd.DataFrame(fish_data)
                print(f"获取到 {len(fish_data)} 条鱼类数据")
                
                # 计算统计信息
                if 'species' in fish_df.columns:
                    fish_stats['species_count'] = len(fish_df['species'].unique())
                    fish_stats['species_distribution'] = fish_df['species'].value_counts().head(5).to_dict()
                if 'weight' in fish_df.columns:
                    fish_stats['avg_weight'] = round(fish_df['weight'].mean(), 2)
                    fish_stats['max_weight'] = round(fish_df['weight'].max(), 2)
                
                fish_stats['total_records'] = len(fish_data)
        except Exception as e:
            print(f"获取鱼类数据失败: {e}")
            fish_data = []
        
        print("数据获取完成，开始生成图表...")
        
        # 3. 生成图表
        chart_files = []
        
        # 生成水质等级分布图
        if water_data and 'grade_distribution' in water_stats:
            try:
                plt.figure(figsize=(8, 6))
                grades = list(water_stats['grade_distribution'].keys())
                counts = list(water_stats['grade_distribution'].values())
                
                plt.pie(counts, labels=grades, autopct='%1.1f%%', startangle=90)
                plt.title('水质等级分布', fontsize=14, pad=20)
                
                chart_filename = f"water_quality_chart_{year}_{month}.png"
                plt.savefig(chart_filename, dpi=150, bbox_inches='tight')
                plt.close()
                chart_files.append(chart_filename)
                print("水质分布图生成成功")
            except Exception as e:
                print(f"生成水质图表失败: {e}")
        
        # 生成鱼类种类分布图
        if fish_data and 'species_distribution' in fish_stats:
            try:
                plt.figure(figsize=(10, 6))
                species = list(fish_stats['species_distribution'].keys())
                counts = list(fish_stats['species_distribution'].values())
                
                plt.bar(range(len(species)), counts)
                plt.xlabel('鱼类种类')
                plt.ylabel('数量')
                plt.title('主要鱼类种类分布 (前5名)', fontsize=14, pad=20)
                plt.xticks(range(len(species)), species, rotation=45)
                
                chart_filename = f"fish_species_chart_{year}_{month}.png"
                plt.savefig(chart_filename, dpi=150, bbox_inches='tight')
                plt.close()
                chart_files.append(chart_filename)
                print("鱼类分布图生成成功")
            except Exception as e:
                print(f"生成鱼类图表失败: {e}")
        
        print("图表生成完成，开始创建PDF...")
        
        # 4. 创建PDF
        c = canvas.Canvas(filename, pagesize=A4)
        width, height = A4
        
        # 尝试注册中文字体
        chinese_font_bold = "Helvetica-Bold"
        chinese_font_normal = "Helvetica"
        use_chinese = False
        
        try:
            import platform
            if platform.system() == "Windows":
                try:
                    pdfmetrics.registerFont(TTFont('SimSun', 'C:/Windows/Fonts/simsun.ttc'))
                    pdfmetrics.registerFont(TTFont('SimHei', 'C:/Windows/Fonts/simhei.ttf'))
                    chinese_font_normal = 'SimSun'
                    chinese_font_bold = 'SimHei'
                    use_chinese = True
                    print("成功注册Windows中文字体")
                except:
                    print("Windows中文字体注册失败，使用英文字体")
        except Exception as font_error:
            print(f"字体注册失败: {font_error}")
        
        # 标题
        c.setFont(chinese_font_bold, 20)
        if use_chinese:
            c.drawCentredString(width/2, height - 50, "智慧海洋牧场综合分析报告")
            c.setFont(chinese_font_normal, 12)
            c.drawCentredString(width/2, height - 80, f"报告时间：{year}年{month}月")
        else:
            c.drawCentredString(width/2, height - 50, "Ocean Ranch Analysis Report")
            c.setFont(chinese_font_normal, 12) 
            c.drawCentredString(width/2, height - 80, f"Period: {year}-{month}")
        
        y_position = height - 120
        
        # 1. 系统概览
        c.setFont(chinese_font_bold, 14)
        if use_chinese:
            c.drawString(50, y_position, "一、系统概览")
        else:
            c.drawString(50, y_position, "1. System Overview")
        y_position -= 30
        
        c.setFont(chinese_font_normal, 10)
        if use_chinese:
            c.drawString(70, y_position, f"报告生成时间：{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            y_position -= 15
            c.drawString(70, y_position, f"数据时期：{year}年{month}月")
            y_position -= 15
            c.drawString(70, y_position, f"数据表：{table_name}")
            y_position -= 15
            c.drawString(70, y_position, f"水质监测记录数：{water_stats.get('total_records', 0)} 条")
            y_position -= 15
            c.drawString(70, y_position, f"鱼类数据记录数：{fish_stats.get('total_records', 0)} 条")
        else:
            c.drawString(70, y_position, f"Report generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            y_position -= 15
            c.drawString(70, y_position, f"Data period: {year}-{month}")
            y_position -= 15
            c.drawString(70, y_position, f"Table: {table_name}")
            y_position -= 15
            c.drawString(70, y_position, f"Water quality records: {water_stats.get('total_records', 0)}")
            y_position -= 15
            c.drawString(70, y_position, f"Fish data records: {fish_stats.get('total_records', 0)}")
        y_position -= 30
        
        # 2. 水质监测数据分析
        c.setFont(chinese_font_bold, 14)
        if use_chinese:
            c.drawString(50, y_position, "二、水质监测数据分析")
        else:
            c.drawString(50, y_position, "2. Water Quality Analysis")
        y_position -= 25
        
        c.setFont(chinese_font_normal, 10)
        if water_stats:
            if use_chinese:
                c.drawString(70, y_position, f"监测省份数量：{water_stats.get('province_count', 0)} 个")
                y_position -= 15
                c.drawString(70, y_position, f"监测流域数量：{water_stats.get('basin_count', 0)} 个")
                y_position -= 15
                
                # 显示水质等级分布
                if 'grade_distribution' in water_stats:
                    c.drawString(70, y_position, "水质等级分布：")
                    y_position -= 15
                    for grade, count in water_stats['grade_distribution'].items():
                        c.drawString(90, y_position, f"等级{grade}: {count}条记录")
                        y_position -= 12
            else:
                c.drawString(70, y_position, f"Provinces monitored: {water_stats.get('province_count', 0)}")
                y_position -= 15
                c.drawString(70, y_position, f"Basins monitored: {water_stats.get('basin_count', 0)}")
                y_position -= 15
                
                if 'grade_distribution' in water_stats:
                    c.drawString(70, y_position, "Water quality grade distribution:")
                    y_position -= 15
                    for grade, count in water_stats['grade_distribution'].items():
                        c.drawString(90, y_position, f"Grade {grade}: {count} records")
                        y_position -= 12
        else:
            if use_chinese:
                c.drawString(70, y_position, "暂无水质数据")
            else:
                c.drawString(70, y_position, "No water quality data available")
        y_position -= 30
        
        # 3. 鱼类数据分析
        c.setFont(chinese_font_bold, 14)
        if use_chinese:
            c.drawString(50, y_position, "三、鱼类数据分析")
        else:
            c.drawString(50, y_position, "3. Fish Data Analysis")
        y_position -= 25
        
        c.setFont(chinese_font_normal, 10)
        if fish_stats:
            if use_chinese:
                c.drawString(70, y_position, f"鱼类种类数量：{fish_stats.get('species_count', 0)} 种")
                y_position -= 15
                c.drawString(70, y_position, f"平均重量：{fish_stats.get('avg_weight', 0)} 克")
                y_position -= 15
                c.drawString(70, y_position, f"最大重量：{fish_stats.get('max_weight', 0)} 克")
                y_position -= 20
                
                # 显示主要鱼类分布
                if 'species_distribution' in fish_stats:
                    c.drawString(70, y_position, "主要鱼类分布：")
                    y_position -= 15
                    for species, count in fish_stats['species_distribution'].items():
                        c.drawString(90, y_position, f"{species}: {count}条")
                        y_position -= 12
            else:
                c.drawString(70, y_position, f"Fish species count: {fish_stats.get('species_count', 0)}")
                y_position -= 15
                c.drawString(70, y_position, f"Average weight: {fish_stats.get('avg_weight', 0)} g")
                y_position -= 15
                c.drawString(70, y_position, f"Maximum weight: {fish_stats.get('max_weight', 0)} g")
                y_position -= 20
                
                if 'species_distribution' in fish_stats:
                    c.drawString(70, y_position, "Main species distribution:")
                    y_position -= 15
                    for species, count in fish_stats['species_distribution'].items():
                        c.drawString(90, y_position, f"{species}: {count} records")
                        y_position -= 12
        else:
            if use_chinese:
                c.drawString(70, y_position, "暂无鱼类数据")
            else:
                c.drawString(70, y_position, "No fish data available")
        y_position -= 30
        
        # 4. 数据可视化图表
        if chart_files:
            c.setFont(chinese_font_bold, 14)
            if use_chinese:
                c.drawString(50, y_position, "四、数据可视化图表")
            else:
                c.drawString(50, y_position, "4. Data Visualization")
            y_position -= 25
            
            # 检查页面空间，如果不够则新建页面
            if y_position < 300:
                c.showPage()
                y_position = height - 50
            
            # 嵌入图表
            for i, chart_file in enumerate(chart_files):
                try:
                    if os.path.exists(chart_file):
                        # 计算图表尺寸和位置
                        chart_width = 400
                        chart_height = 250
                        x_pos = (width - chart_width) / 2
                        
                        # 检查页面空间
                        if y_position - chart_height < 50:
                            c.showPage()
                            y_position = height - 50
                        
                        # 插入图表
                        c.drawImage(chart_file, x_pos, y_position - chart_height, 
                                  width=chart_width, height=chart_height)
                        y_position -= chart_height + 30
                        
                        print(f"图表 {chart_file} 已嵌入PDF")
                except Exception as e:
                    print(f"嵌入图表失败: {e}")
                    if use_chinese:
                        c.drawString(70, y_position, f"图表 {i+1} 加载失败")
                    else:
                        c.drawString(70, y_position, f"Chart {i+1} failed to load")
                    y_position -= 20
        
        # 5. 报告结论
        # 检查页面空间
        if y_position < 200:
            c.showPage()
            y_position = height - 50
        
        c.setFont(chinese_font_bold, 14)
        if use_chinese:
            c.drawString(50, y_position, "五、分析结论")
        else:
            c.drawString(50, y_position, "5. Analysis Conclusions")
        y_position -= 25
        
        c.setFont(chinese_font_normal, 10)
        if use_chinese:
            conclusion_lines = [
                f"本期({year}年{month}月)海洋牧场监测报告分析完成。",
                f"本期共监测水质数据 {water_stats.get('total_records', 0)} 条，鱼类数据 {fish_stats.get('total_records', 0)} 条。",
                "主要发现："
            ]
            
            if water_stats:
                conclusion_lines.append(f"• 水质监测覆盖 {water_stats.get('province_count', 0)} 个省份，{water_stats.get('basin_count', 0)} 个流域")
                if 'grade_distribution' in water_stats:
                    best_grade = min(water_stats['grade_distribution'].keys())
                    conclusion_lines.append(f"• 最优水质等级为 {best_grade}")
            
            if fish_stats:
                conclusion_lines.append(f"• 监测到鱼类种类共 {fish_stats.get('species_count', 0)} 种")
                conclusion_lines.append(f"• 鱼类平均重量 {fish_stats.get('avg_weight', 0)} 克")
            
            conclusion_lines.extend([
                "",
                "建议：",
                "• 继续加强水质监测，确保海洋环境质量",
                "• 保持鱼类资源的可持续发展",
                "• 定期进行数据分析和报告生成",
                "",
                "报告生成完成。"
            ])
        else:
            conclusion_lines = [
                f"Ocean ranch monitoring report for {year}-{month} completed.",
                f"This period monitored {water_stats.get('total_records', 0)} water quality records and {fish_stats.get('total_records', 0)} fish data records.",
                "Key findings:"
            ]
            
            if water_stats:
                conclusion_lines.append(f"• Water quality monitoring covers {water_stats.get('province_count', 0)} provinces and {water_stats.get('basin_count', 0)} basins")
                if 'grade_distribution' in water_stats:
                    best_grade = min(water_stats['grade_distribution'].keys())
                    conclusion_lines.append(f"• Best water quality grade: {best_grade}")
            
            if fish_stats:
                conclusion_lines.append(f"• Total fish species monitored: {fish_stats.get('species_count', 0)}")
                conclusion_lines.append(f"• Average fish weight: {fish_stats.get('avg_weight', 0)} g")
            
            conclusion_lines.extend([
                "",
                "Recommendations:",
                "• Continue strengthening water quality monitoring",
                "• Maintain sustainable development of fish resources", 
                "• Regular data analysis and report generation",
                "",
                "Report generation completed."
            ])
        
        for line in conclusion_lines:
            if y_position < 50:
                c.showPage()
                y_position = height - 50
            
            if line.startswith("•"):
                c.drawString(90, y_position, line)
            else:
                c.drawString(70, y_position, line)
            y_position -= 15
        
        print("报告内容绘制完成")
        
        # 清理生成的图表文件
        for chart_file in chart_files:
            try:
                if os.path.exists(chart_file):
                    os.remove(chart_file)
                    print(f"已清理图表文件: {chart_file}")
            except Exception as e:
                print(f"清理图表文件失败: {e}")
        
        # 保存PDF
        c.save()
        print(f"PDF文件已保存: {filename}")
        
        return send_file(
            filename,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        error_msg = f"PDF生成失败: {str(e)}"
        print(error_msg)
        print(f"错误类型: {type(e).__name__}")
        import traceback
        print(f"错误堆栈: {traceback.format_exc()}")
        
        # 应急方案：生成最简单的错误报告PDF
        try:
            print("尝试生成应急错误报告...")
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import A4
            
            emergency_filename = f"error_report_{year}_{month}.pdf"
            c = canvas.Canvas(emergency_filename, pagesize=A4)
            width, height = A4
            
            c.setFont("Helvetica-Bold", 16)
            c.drawString(100, height - 100, "Error Report / 错误报告")
            c.setFont("Helvetica", 12)
            c.drawString(100, height - 130, f"Failed to generate comprehensive report for {year}-{month}")
            c.drawString(100, height - 150, f"无法生成 {year}年{month}月 的综合报告")
            c.drawString(100, height - 170, f"Error: {str(e)}")
            c.drawString(100, height - 190, "Please check server logs for details.")
            c.drawString(100, height - 210, "请检查服务器日志获取详细信息。")
            
            c.save()
            print("应急错误报告生成成功")
            
            return send_file(
                emergency_filename,
                as_attachment=True,
                download_name=emergency_filename,
                mimetype='application/pdf'
            )
        except Exception as emergency_error:
            print(f"应急报告也失败了: {str(emergency_error)}")
            return jsonify({"success": False, "error": error_msg}), 500

# 数据上传相关API
@app.route('/api/upload/data', methods=['POST'])
def upload_data():
    """上传单条或多条数据"""
    try:
        data = request.get_json()
        data_type = data.get('dataType')
        upload_data = data.get('data', [])
        
        if not data_type or not upload_data:
            return jsonify({"success": False, "error": "缺少数据类型或数据内容"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        success_count = 0
        error_count = 0
        errors = []
        
        for item in upload_data:
            try:
                if data_type == 'water_quality':
                    success = insert_water_quality_data(cursor, item)
                elif data_type == 'fish_data':
                    success = insert_fish_data(cursor, item)
                else:
                    return jsonify({"success": False, "error": "不支持的数据类型"}), 400
                
                if success:
                    success_count += 1
                else:
                    error_count += 1
                    errors.append(f"数据插入失败: {item}")
                    
            except Exception as e:
                error_count += 1
                errors.append(f"处理数据时出错: {str(e)}")
        
        conn.commit()
        conn.close()
        
        result = {
            "success": error_count == 0,
            "message": f"成功上传 {success_count} 条数据",
            "success_count": success_count,
            "error_count": error_count
        }
        
        if errors and len(errors) <= 5:  # 只返回前5个错误
            result["errors"] = errors[:5]
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"success": False, "error": f"数据上传失败: {str(e)}"}), 500

@app.route('/api/upload/csv', methods=['POST'])
def upload_csv_data():
    """批量上传CSV数据"""
    try:
        data = request.get_json()
        data_type = data.get('dataType')
        csv_data = data.get('data', [])
        
        if not data_type or not csv_data:
            return jsonify({"success": False, "error": "缺少数据类型或数据内容"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        success_count = 0
        error_count = 0
        
        for item in csv_data:
            try:
                # 移除ID字段
                if 'id' in item:
                    del item['id']
                
                if data_type == 'water_quality':
                    success = insert_water_quality_data(cursor, item)
                elif data_type == 'fish_data':
                    success = insert_fish_data(cursor, item)
                else:
                    return jsonify({"success": False, "error": "不支持的数据类型"}), 400
                
                if success:
                    success_count += 1
                else:
                    error_count += 1
                    
            except Exception as e:
                error_count += 1
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": error_count == 0,
            "message": f"批量上传完成，成功 {success_count} 条，失败 {error_count} 条",
            "success_count": success_count,
            "error_count": error_count
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": f"CSV数据上传失败: {str(e)}"}), 500

def insert_water_quality_data(cursor, data):
    """插入水质数据到数据库"""
    try:
        # 获取当前年月来确定表名
        monitor_time = data.get('monitor_time')
        
        if monitor_time:
            # 从时间中提取年月
            from datetime import datetime
            dt = datetime.fromisoformat(monitor_time.replace('Z', '+00:00'))
            table_name = f"{dt.year}-{dt.month:02d}"
        else:
            # 如果没有时间，使用当前时间
            from datetime import datetime
            now = datetime.now()
            table_name = f"{now.year}-{now.month:02d}"
        
        # 创建表（如果不存在）
        create_water_quality_table_if_not_exists(cursor, table_name)
        
        # 准备插入数据
        fields = []
        values = []
        placeholders = []
        
        # 定义字段映射
        field_mapping = {
            'province': 'province',
            'basin': 'basin', 
            'section_name': 'section_name',
            'monitor_time': 'monitor_time',
            'water_quality_category': 'water_quality_category',
            'water_temperature': 'water_temperature',
            'pH': 'pH',
            'dissolved_oxygen': 'dissolved_oxygen',
            'conductivity': 'conductivity',
            'turbidity': 'turbidity',
            'permanganate_index': 'permanganate_index',
            'ammonia_nitrogen': 'ammonia_nitrogen',
            'total_phosphorus': 'total_phosphorus',
            'total_nitrogen': 'total_nitrogen',
            'chlorophyll_a': 'chlorophyll_a',
            'algae_density': 'algae_density',
            'station_status': 'station_status'
        }
        
        for key, db_field in field_mapping.items():
            if key in data and data[key] and str(data[key]).strip():
                fields.append(db_field)
                values.append(data[key])
                placeholders.append('%s')
        
        if not fields:
            return False
        
        query = f"INSERT INTO `{table_name}` ({', '.join(fields)}) VALUES ({', '.join(placeholders)})"
        cursor.execute(query, values)
        return True
        
    except Exception as e:
        return False

def insert_fish_data(cursor, data):
    """插入鱼类数据到数据库"""
    try:
        # 准备插入数据
        fields = []
        values = []
        placeholders = []
        
        # 定义字段映射
        field_mapping = {
            'species': 'species',
            'weight': 'weight',
            'length1': 'length1',
            'length2': 'length2',
            'length3': 'length3',
            'height': 'height',
            'width': 'width'
        }
        
        for key, db_field in field_mapping.items():
            if key in data and data[key] and str(data[key]).strip():
                fields.append(db_field)
                values.append(data[key])
                placeholders.append('%s')
        
        if not fields:
            return False
        
        query = f"INSERT INTO fishes ({', '.join(fields)}) VALUES ({', '.join(placeholders)})"
        cursor.execute(query, values)
        return True
        
    except Exception as e:
        return False

def create_water_quality_table_if_not_exists(cursor, table_name):
    """创建水质数据表（如果不存在）"""
    try:
        cursor.execute(f"SHOW TABLES LIKE '{table_name}'")
        if cursor.fetchone():
            return  # 表已存在
        
        # 创建表
        create_query = f"""
        CREATE TABLE `{table_name}` (
            `province` VARCHAR(255) NOT NULL COMMENT '省份',
            `basin` VARCHAR(255) NOT NULL COMMENT '流域',
            `section_name` VARCHAR(255) NOT NULL COMMENT '断面名称',
            `monitor_time` DATETIME NULL COMMENT '监测时间',
            `water_quality_category` VARCHAR(255) NULL COMMENT '水质类别',
            `water_temperature` FLOAT NULL COMMENT '水温',
            `pH` FLOAT NULL COMMENT 'pH值',
            `dissolved_oxygen` FLOAT NULL COMMENT '溶解氧',
            `conductivity` FLOAT NULL COMMENT '电导率',
            `turbidity` FLOAT NULL COMMENT '浊度',
            `permanganate_index` FLOAT NULL COMMENT '高锰酸盐指数',
            `ammonia_nitrogen` FLOAT NULL COMMENT '氨氮',
            `total_phosphorus` FLOAT NULL COMMENT '总磷',
            `total_nitrogen` FLOAT NULL COMMENT '总氮',
            `chlorophyll_a` FLOAT NULL COMMENT '叶绿素α',
            `algae_density` FLOAT NULL COMMENT '藻密度',
            `station_status` VARCHAR(255) NULL COMMENT '站点情况'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='{table_name}水质监测数据'
        """
        cursor.execute(create_query)
        
    except Exception as e:
        pass



@app.route('/api/recent-data', methods=['GET'])
def get_recent_data():
    """获取最近上传的数据"""
    try:
        data_type = request.args.get('dataType')
        limit = int(request.args.get('limit', 20))
        
        if not data_type:
            return jsonify({"success": False, "error": "缺少数据类型参数"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        recent_data = []
        
        if data_type == 'water_quality':
            # 获取最近的水质数据
            recent_data = get_recent_water_quality_data(cursor, limit)
        elif data_type == 'fish_data':
            # 获取最近的鱼类数据
            recent_data = get_recent_fish_data(cursor, limit)
        else:
            return jsonify({"success": False, "error": "不支持的数据类型"}), 400
        
        conn.close()
        
        return jsonify({
            "success": True,
            "data": recent_data,
            "count": len(recent_data)
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": f"获取最近数据失败: {str(e)}"}), 500

def get_recent_water_quality_data(cursor, limit):
    """获取最近的水质数据"""
    try:
        # 获取所有水质数据表
        cursor.execute("SHOW TABLES LIKE '%-%'")
        tables = cursor.fetchall()
        
        all_data = []
        
        for table_info in tables:
            table_name = list(table_info.values())[0]
            
            # 验证表名格式 (YYYY-MM)
            if len(table_name) == 7 and table_name[4] == '-':
                try:
                    # 获取该表的最新数据
                    query = f"""
                    SELECT *, '{table_name}' as source_table 
                    FROM `{table_name}` 
                    ORDER BY monitor_time DESC, province, basin, section_name 
                    LIMIT {limit}
                    """
                    cursor.execute(query)
                    table_data = cursor.fetchall()
                    
                    # 为每条数据添加估算的上传时间
                    for row in table_data:
                        # 如果有monitor_time就用它，否则用表名估算
                        if row.get('monitor_time'):
                            row['upload_time'] = row['monitor_time']
                        else:
                            # 用表名生成一个估算时间
                            year, month = table_name.split('-')
                            row['upload_time'] = f"{year}-{month}-01T00:00:00"
                    
                    all_data.extend(table_data)
                    
                except Exception as e:
                    continue
        
        # 按时间排序并限制数量
        all_data.sort(key=lambda x: x.get('upload_time', ''), reverse=True)
        return all_data[:limit]
        
    except Exception as e:
        return []

def get_recent_fish_data(cursor, limit):
    """获取最近的鱼类数据"""
    try:
        # 首先检查表是否存在
        cursor.execute("SHOW TABLES LIKE 'fishes'")
        table_exists = cursor.fetchone()
        if not table_exists:
            return []
        
        # 获取表结构，查看是否有id字段
        cursor.execute("DESCRIBE fishes")
        table_structure = cursor.fetchall()
        
        # 检查是否有id字段
        has_id_field = any(field['Field'] == 'id' for field in table_structure)
        
        # 根据是否有id字段选择不同的查询策略
        if has_id_field:
            query = f"SELECT * FROM fishes ORDER BY id DESC LIMIT {limit}"
            cursor.execute(query)
            fish_data = cursor.fetchall()
        else:
            # 如果没有id字段，先获取总数，然后从末尾开始获取数据
            cursor.execute("SELECT COUNT(*) as total FROM fishes")
            total_count = cursor.fetchone()['total']
            
            if total_count <= limit:
                # 如果总数据量小于等于限制数量，直接获取所有数据
                query = "SELECT * FROM fishes"
            else:
                # 获取最后几条数据：跳过前面的数据，获取末尾的数据
                offset = total_count - limit
                query = f"SELECT * FROM fishes LIMIT {limit} OFFSET {offset}"
            
            cursor.execute(query)
            fish_data = cursor.fetchall()
            
            # 由于我们获取的是末尾数据，需要反转顺序让最新的数据在前面
            fish_data = list(reversed(fish_data))
        
        # 为每条数据添加估算的上传时间
        for i, row in enumerate(fish_data):
            from datetime import datetime, timedelta
            # 如果有id字段，使用id作为时间顺序；否则使用索引
            if has_id_field and 'id' in row:
                # ID越大越新
                estimated_time = datetime.now() - timedelta(minutes=len(fish_data)-i-1)
            else:
                # 没有id，按索引估算时间
                estimated_time = datetime.now() - timedelta(minutes=i)
            row['upload_time'] = estimated_time.isoformat()
        
        return fish_data
        
    except Exception as e:
        return []

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=SERVER_PORT, debug=True)
