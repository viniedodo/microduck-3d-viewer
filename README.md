# Microduck 3D Viewer

Pollen Robotics Microduck 双足机器鸭的 3D 在线查看工具集：**装配参考查看器**（组装态 + 手动爆炸拆解）与 **3MF 打印工程查看器**，基于 kissqy / fanhao375 复刻项目的公开资料。

## 在线使用

### 鸭子 3D 装配参考
**https://viniedodo.github.io/microduck-3d-viewer/**

- 拖动旋转 · 滚轮缩放 · 右键平移
- **整体爆炸滑杆（0–250%）**：按官方 `assembly-explosion.js` 偏移表渐进分离全部打印件
- **点击零件选中**：高亮并显示零件中文名，用「单独拉出」滑杆（0–300%）沿官方爆炸方向把该零件单独拉出；多个零件可分别拉出，配合整体爆炸自由组合
- 「重置」一键全部归位；舵机、轴承、镜头、扬声器按官方约定保持原位

### 3MF 打印工程查看器
**https://viniedodo.github.io/microduck-3d-viewer/3mf.html**

- 打开本地任意 `.3mf` 文件（按钮选择或直接拖拽进页面）
- 内置两个样例，一键载入：
  - **kissqy 缝合怪摆盘**（5 盘打印工程，39 个网格对象）
  - **replica 飞特版 Bambu Studio 工程**（2026-11-02 版，43 个网格对象）
- 显示网格对象数、三角形数、尺寸（mm，Z 向上）

> 3MF 样例仅供预览结构；要实际切片打印，请在 [Bambu Studio / OrcaSlicer](https://bambulab.com/download/studio) 中打开原工程以获得支撑、耗材与摆盘参数。

## 模型文件下载

见 [Releases v1.0](https://github.com/viniedodo/microduck-3d-viewer/releases/tag/v1.0)：

| 文件 | 说明 |
|---|---|
| `duck.obj` + `duck.mtl` | 组装态，64 个零件命名分组 + 颜色材质（Blender 导入保留分组与颜色） |
| `duck.stl` | 组装态整体网格（718,160 三角形，二进制 STL） |
| `duck-exploded.obj` + `.mtl` | 爆炸态模型 |
| `duck-exploded.stl` | 爆炸态整体网格 |

坐标 Z 轴向上（机器人本体坐标系），单位米，零位姿态（关节全部 0°），组装态底面 z=0；爆炸态与组装态共用同一地面参考，可直接叠加比对。

## 本地运行

Windows 双击 `启动本地查看器.cmd`（需已安装 Python）；或手动：

```bash
git clone https://github.com/viniedodo/microduck-3d-viewer.git
cd microduck-3d-viewer
python -m http.server 8090 --bind 127.0.0.1
# 浏览器打开 http://127.0.0.1:8090/
```

（three.js 模块加载需要 HTTP 服务，不能直接双击 index.html。）

## 来源与许可

- 鸭子几何：`duck-visual.bin`（DUCK/2 自定义格式），取自 [kissqy/Microduck-kissqy](https://github.com/kissqy/Microduck-kissqy) 中控 R17 发布包；视觉模型上游为 [pollen-robotics/microduck_rl](https://github.com/pollen-robotics/microduck_rl)（视觉修订 `e8a2de5`）
- 爆炸偏移表：kissqy 仓库 `docs/assembly-explosion.js`
- 3MF 样例：`print-projects/` 内两个文件分别来自 [kissqy/Microduck-kissqy](https://github.com/kissqy/Microduck-kissqy)（缝合怪打印件）与 [fanhao375/microduck-replica-cad](https://github.com/fanhao375/microduck-replica-cad)（飞特版打印工程），几何均源自上游 `microduck_rl`
- **模型许可：CC BY-NC-SA 4.0**（署名-非商业性使用-相同方式共享）；three.js 为 MIT；上游软件代码为 Apache-2.0
- 本仓库为个人学习与非商业用途发布