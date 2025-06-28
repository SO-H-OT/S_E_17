import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

/**
 * 导出图表为图片
 * @param {string} elementId - 图表元素的ID
 * @param {string} filename - 保存的文件名（不含扩展名）
 * @param {string} format - 图片格式（png/jpeg）
 * @param {number} quality - 图片质量（0-1，仅对jpeg有效）
 */
export const exportChart = async (elementId, filename = 'chart', format = 'png', quality = 0.9) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`找不到ID为 "${elementId}" 的元素`);
    }

    // 使用html2canvas生成canvas
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // 提高分辨率
      useCORS: true,
      allowTaint: false,
      height: element.scrollHeight,
      width: element.scrollWidth
    });

    // 转换为blob并下载
    canvas.toBlob((blob) => {
      if (blob) {
        const fileExtension = format.toLowerCase() === 'jpeg' ? 'jpg' : format.toLowerCase();
        saveAs(blob, `${filename}.${fileExtension}`);
      }
    }, `image/${format}`, quality);

  } catch (error) {
    console.error('图表导出失败:', error);
    alert('图表导出失败: ' + error.message);
  }
};

/**
 * 批量导出多个图表
 * @param {Array} charts - 图表配置数组 [{elementId: '', filename: ''}]
 * @param {string} format - 图片格式
 */
export const exportMultipleCharts = async (charts, format = 'png') => {
  try {
    for (let i = 0; i < charts.length; i++) {
      const chart = charts[i];
      await exportChart(chart.elementId, chart.filename, format);
      // 添加延迟避免浏览器阻塞
      if (i < charts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  } catch (error) {
    console.error('批量导出失败:', error);
    alert('批量导出失败: ' + error.message);
  }
};

/**
 * 导出页面所有图表
 * @param {string} pageTitle - 页面标题，用于文件名前缀
 */
export const exportAllChartsInPage = async (pageTitle = 'charts') => {
  try {
    // 查找页面中所有带有 chart-container 类的元素
    const chartElements = document.querySelectorAll('.chart-container');
    
    if (chartElements.length === 0) {
      alert('当前页面没有找到可导出的图表');
      return;
    }

    const charts = Array.from(chartElements).map((element, index) => ({
      elementId: element.id || `chart-${index}`,
      filename: `${pageTitle}_图表${index + 1}`
    }));

    await exportMultipleCharts(charts);
    
  } catch (error) {
    console.error('导出所有图表失败:', error);
    alert('导出所有图表失败: ' + error.message);
  }
}; 