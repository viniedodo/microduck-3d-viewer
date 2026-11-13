# Microduck 3D Viewer

Pollen Robotics Microduck 双足机器鸭的 3D 装配参考查看器（组装态 + 官方爆炸图），基于 kissqy 复刻项目 R17 中控的视觉模型。

## 在线查看

**https://viniedodo.github.io/microduck-3d-viewer/**

- 拖动旋转 · 滚轮缩放 · 右键平移
- **整体爆炸滑杆（0–250%）**：按官方 `assembly-explosion.js` 偏移表渐进分离全部打印件，想看多开就拉多开
- **点击零件选中**：高亮并显示零件中文名，用「单独拉出」滑杆（0–300%）沿官方爆炸方向把该零件单独拉出；多个零件可分别拉出，配合整体爆炸自由组合
- 「重置」一键全部归位
- 舵机、轴承、镜头、扬声器按官方约定保持原位

## 模型文件下载

见 [Releases](https://github.com/viniedodo/microduck-3d-viewer/releases)（v1.0）：

| 文件 | 说明 |
|---|---|
| `duck.obj` + `duck.mtl` | 组装态，64 个零件命名分组 + 颜色材质（Blender 导入保留分组与颜色） |
| `duck.stl` | 组装态整体网格（718,160 三角形，二进制 STL） |
| `duck-exploded.obj` + `.mtl` | 爆炸态模型 |
| `duck-exploded.stl` | 爆炸态整体网格 |

坐标 Z 轴向上（机器人本体坐标系），单位米，零位姿态（关节全部 0°），组装态底面 z=0；爆炸态与组装态共用同一地面参考，可直接叠加比对。

## 本地运行

```bash
git clone https://github.com/viniedodo/microduck-3d-viewer.git
cd microduck-3d-viewer
python -m http.server 8090
# 浏览器打开 http://127.0.0.1:8090/
```

（three.js 模块加载需要 HTTP 服务，不能直接双击 index.html。）

## 来源与许可

- 几何数据：`duck-visual.bin`（DUCK/2 自定义格式），取自 [kissqy/Microduck-kissqy](https://github.com/kissqy/Microduck-kissqy) 中控 R17 发布包；视觉模型上游为 [pollen-robotics/microduck_rl](https://github.com/pollen-robotics/microduck_rl)（视觉修订 `e8a2de5`）
- 爆炸偏移表：kissqy 仓库 `docs/assembly-explosion.js`
- **模型许可：CC BY-NC-SA 4.0**（署名-非商业性使用-相同方式共享）；three.js 为 MIT；上游软件代码为 Apache-2.0
- 本仓库为个人学习与非商业用途发布
