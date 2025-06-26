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
    'password': '114514',  # 请更改为你的数据库密码
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
        url = "https://air-quality-api.open-meteo.com/v1/air-quality"
        params = {
            "latitude": 52.52,
            "longitude": 13.41,
            "hourly": ["pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone"]
        }
        response = requests.get(url, params=params)
        data = response.json()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

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
        # 获取请求参数（默认为 2025 年和 05 月）
        year = request.args.get('year', '2025')
        month = request.args.get('month', '05')

        # 构造表名
        table_name = f"{year}-{month}"

        # 构造查询语句
        sql = f"""
            SELECT DISTINCT province, basin,section_name
            FROM `{table_name}`
            ORDER BY province, basin,section_name
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
        result = [{"province": row["province"], "basin": row["basin"],"section_name":row["section_name"]} for row in rows]  # 使用字段名访问数据
        return jsonify({"success": True, "data": result})

    except Exception as e:
        app.logger.error(f"Error during query execution: {str(e)}")
        app.logger.error(f"Query result: {rows}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/water-quality/province-basin-list', methods=['GET'])
def get_province_basin_list():
    try:
        # 获取请求参数（默认为 2025 年和 05 月）
        year = request.args.get('year', '2025')
        month = request.args.get('month', '05')

        # 构造表名
        table_name = f"{year}-{month}"

        # 构造查询语句
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
        with conn.cursor(DictCursor) as cursor:  # ✅ 局部使用 DictCursor
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=SERVER_PORT, debug=True)
