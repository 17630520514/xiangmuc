"""
工具函数模块
包含各种兼容性和辅助函数
"""

import datetime
from typing import Union


def parse_iso_datetime(date_string: str) -> datetime.datetime:
    """
    解析ISO格式的日期时间字符串，兼容Python 3.6
    
    Args:
        date_string: ISO格式的日期时间字符串
        
    Returns:
        datetime对象
        
    Raises:
        ValueError: 如果日期格式无效
    """
    try:
        # 尝试使用Python 3.7+的fromisoformat方法
        if hasattr(datetime.datetime, 'fromisoformat'):
            return datetime.datetime.fromisoformat(date_string)
        else:
            # Python 3.6兼容性实现
            # 移除可能的Z后缀（UTC标识）
            if date_string.endswith('Z'):
                date_string = date_string[:-1]
            
            # 尝试解析常见的ISO格式
            formats = [
                '%Y-%m-%dT%H:%M:%S.%f',
                '%Y-%m-%dT%H:%M:%S',
                '%Y-%m-%d %H:%M:%S.%f',
                '%Y-%m-%d %H:%M:%S',
                '%Y-%m-%d'
            ]
            
            for fmt in formats:
                try:
                    return datetime.datetime.strptime(date_string, fmt)
                except ValueError:
                    continue
            
            # 如果所有格式都失败，抛出错误
            raise ValueError(f"无法解析日期字符串: {date_string}")
            
    except Exception as e:
        raise ValueError(f"日期解析失败: {str(e)}")


def format_datetime(dt: datetime.datetime, format_str: str = None) -> str:
    """
    格式化datetime对象为字符串
    
    Args:
        dt: datetime对象
        format_str: 格式字符串，如果为None则使用ISO格式
        
    Returns:
        格式化后的字符串
    """
    if format_str is None:
        # 使用ISO格式，兼容Python 3.6
        if hasattr(dt, 'isoformat'):
            return dt.isoformat()
        else:
            return dt.strftime('%Y-%m-%dT%H:%M:%S.%f')
    else:
        return dt.strftime(format_str)


def is_valid_date(date_string: str) -> bool:
    """
    检查日期字符串是否有效
    
    Args:
        date_string: 日期字符串
        
    Returns:
        如果有效返回True，否则返回False
    """
    try:
        parse_iso_datetime(date_string)
        return True
    except ValueError:
        return False
