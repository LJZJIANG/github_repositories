/*
 * @Descripttion: 描述
 * @Author: ljz
 * @Date: 2021-02-04 10:00:43
 * @LastEditors: ljz
 * @LastEditTime: 2021-03-22 16:32:32
 */
import './App.css';
import { Button, Input, Table, Form } from 'antd';
import React from 'react';
import axios from 'axios';
import moment from 'moment'
import * as echarts from 'echarts'

import githubIcon from './assets/imgs/gitHub.png'
import repositoryIcon from './assets/imgs/repository.png'
import clockIcon from './assets/imgs/clock.png'
import emailIcon from './assets/imgs/email.png'
import APIS from './api/api';



// 表格列名
const columns = [
  {
    title: 'Repo Name',
    key: 'name',
    dataIndex: 'name',
    // 排序
    sorter: (a, b) => a.name.length - b.name.length
  },
  {
    title: 'Create Time',
    key: 'created_at',
    dataIndex: 'created_at',
    sorter: (a, b) => {
      let aTime = new Date(a.created_at).getTime();
      let bTime = new Date(b.created_at).getTime();
      return aTime - bTime;
    },
    render: (value) => {
      // 格式化时间
      return moment(value).format('YYYY-MM-DD HH:mm:ss')
    }
  },
  {
    title: 'Last update time',
    key: 'updated_at',
    dataIndex: 'updated_at',
    sorter: (a, b) => {
      let aTime = new Date(a.created_at).getTime();
      let bTime = new Date(b.created_at).getTime();
      return aTime - bTime;
    },
    render: (value) => {
      // 格式化时间
      return moment(value).format('YYYY-MM-DD HH:mm:ss')
    }
  },
  {
    title: 'Language',
    key: 'language',
    dataIndex: 'language',
    sorter: (a, b) => {
      if (a.language && b.language) {
        return a.language.length - b.language.length
      }
    }
  },
  {
    title: 'starts',
    key: 'stargazers_count',
    dataIndex: 'stargazers_count',
    sorter: (a, b) => a.stargazers_count - b.stargazers_count
  },
  {
    title: 'Issues',
    key: 'size',
    dataIndex: 'size',
    sorter: (a, b) => a.size - b.size
  },
  {
    title: 'forks',
    key: 'forks',
    dataIndex: 'forks',
    sorter: (a, b) => a.forks_count - b.forks_count
  },
  {
    title: 'commits',
    key: 'forks_count',
    dataIndex: 'forks_count',
    sorter: (a, b) => a.forks_count - b.forks_count
  },
  {
    title: 'Archived Status',
    key: 'archived',
    dataIndex: 'archived',
    sorter: (a, b) => a.archived - b.archived,
    render: (value) => {
      return value.archived ? '是' : '否'
    }
  },
]

class App extends React.Component {

  // 初始化数据
  state = {
    list: [], // repositories 数据列表
    memberList: [],
    userInfo: {}, // 用户信息
    currentPage: 1
  }

  // react生命周期  在里面请求数据
  componentDidMount() {
    let time = localStorage.getItem('time');
    let currentTime = new Date().getTime();
    if (time) {
      // 距离上次请求超过一小时 重新请求
      if (currentTime - time > (1 * 60 * 60 * 1000)) {
        this.getRepositoriesData(this.state.currentPage)
        // 获取用户信息
        this.getUserInfo();
        this.getMemberHeadImgList()
      } else {
        // 使用缓存数据
        let userInfo = JSON.parse(localStorage.getItem('userInfo'));
        let repositoriesData = JSON.parse(localStorage.getItem('repositoriesData'));
        let memberList = JSON.parse(localStorage.getItem('memberList'));
        this.formatPerData(repositoriesData)
        this.setState({
          userInfo,
          memberList,
          list: repositoriesData
        })
      }
    } else {
      this.getRepositoriesData(this.state.currentPage)
      // 获取用户信息
      this.getUserInfo();
      this.getMemberHeadImgList()
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo() {
    let result = await axios.get(APIS.userInfo);
    this.setState({
      userInfo: result.data
    })

    // 设置当前时间
    localStorage.setItem('time', new Date().getTime())
    localStorage.setItem('userInfo', JSON.stringify(result.data))
  }

  /**
   * 获取Repositories列表
   */
  async getRepositoriesData() {
    let { list, currentPage } = this.state;
    // 通过axios请求数据
    // 请求参数来源GitHub api文档  https://docs.github.com/en/rest/reference/repos#list-repositories-for-a-user
    let result = await axios.get(APIS.repositories, {
      params: {
        per_page: 100, //一次请求多少数据,
        page: currentPage,// 当前请求页数
      }
    })
    let repositoriesData = result.data;
    // 合并数据
    list = [...list, ...repositoriesData];
    // 将数据更新到缓存中
    this.setState({ list, currentPage: currentPage + 1 }, () => {
      // 如果返回条数有100 ，代表可能还有更多数据，继续请求下一页数据  直到返回条数小于100时，结束请求
      if (repositoriesData.length >= 100) {
        this.getRepositoriesData()
      } else {
        // 缓存repositoriesData数据
        localStorage.setItem('repositoriesData', JSON.stringify(list));
        this.formatPerData(list)
      }
    })

  }

  /**
   * 获取头像列表
   * @param {*} data 
   */

  async getMemberHeadImgList() {
    let result = null;
    try {
      result = await axios.get(APIS.memberHeadImgs);
      this.setState({
        memberList: result.data
      })
      localStorage.setItem('memberList', JSON.stringify(result.data))

    } catch (error) {
      console.log(error);
    }
  }

  formatPerData(data) {
    let seriesName = new Set()
    data.forEach(item => {
      seriesName.add(item.language);
    });

    let seriesObj = {};
    [...seriesName].forEach(item => {
      seriesObj[item] = {
        value: 0,
        name: item
      }
    })

    data.forEach(item => {
      if (seriesObj[item.language]) {
        seriesObj[item.language].value = seriesObj[item.language].value + 1;
      }
    })
    let seriesData = [];
    for (const key in seriesObj) {
      seriesData.push(seriesObj[key])
    }


    const reposEchartsDom = document.getElementById('repos-echarts');
    // 初始化echarts对象
    const reposEchartsInit = echarts.init(reposEchartsDom);
    // echarts配置项
    const reposEchartsOptions = {
      backgroundColor: '#E1D9CA',
      title: {
        text: 'Repos per Language',
        x: 'center'
      },
      tooltip: {
        trigger: 'item'
      },
      legend: {
        left: 'center',
        bottom: 0,
        itemWidth: 14,
        itemHeight: 8,
        textStyle: {
          fontSize: 10
        }
      },
      series: [
        {
          name: 'Language per',
          type: 'pie',
          radius: ['40%', '60%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: false,
              fontSize: '40',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: seriesData
        }
      ]
    };
    // 设置echarts配置
    reposEchartsInit.setOption(reposEchartsOptions)
  }

  // 点击头像 跳转页面
  handleToavatarGit(url) {
    window.open(url)
  }

  /**
   * 提交数据
   * @param {} value 
   */
  handleSubmit(value) {
    console.log(value);
  }

  /**
   * 判断输入的是不是number类型
   * @param {*} value 
   */
  validatorNumber(rule, value, callback) {
    let reg = /^[0-9]+.?[0-9]*$/; //判断字符串是否为数字
    if (value) {
      if (reg.test(value)) {
        callback()
      } else if (!reg.test(value)) {
        callback('只能输入数字')
      }
    } else {
      callback()
    }
  }

  render() {
    let { userInfo, memberList, list } = this.state
    return (
      <div className="App">
        <div className="title-header">
          <img src={userInfo.avatar_url} alt="头像" />
          <div className="title">{userInfo.name}</div>
        </div>
        <div className="statistics-container">
          <div className="statistics-info">
            <div>
              <h3 className="user-name">{userInfo.login}</h3>
              <div><img src={githubIcon} alt="github" />{userInfo.public_repos} contributions on github</div>
              <div><img src={repositoryIcon} alt="repositoryIcon" />{userInfo.public_repos} public repos</div>
              <div><img src={clockIcon} alt="clockIcon" />Joined Github  {new Date().getFullYear() - new Date(userInfo.created_at).getFullYear()} years ago</div>
              <div><img className="email-icon" src={emailIcon} alt="emailIcon" />{userInfo.email || 'null'}</div>
            </div>
            <div id="contributions-echarts"></div>
          </div>
          <div id="repos-echarts"></div>
          <div className="member-container">
            <p className="member-title">
              <span>People</span>
              <span>{memberList.length}</span>
            </p>
            <div className="member-list">{memberList.map(item => (
              <img className="avatar" key={item.id} src={item.avatar_url} alt="avatar_url" onClick={() => this.handleToavatarGit(item.html_url)} />
            ))}</div>
          </div>
        </div>
        <div className="table-container">
          <Table className="table" size="small" rowKey="id" columns={columns} dataSource={list} />
          <div className="archive-wrapper">
            <div className="archive-wrapper-header">
              <h3>设置权重</h3>
              <Form className="weigth-form"
                onFinish={this.handleSubmit}>
                <Form.Item
                  label="time"
                  name="time"
                  colon={false}
                  rules={[{ validator: this.validatorNumber }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Issues"
                  name="Issues"
                  colon={false}
                  rules={[{ validator: this.validatorNumber }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="stars"
                  name="stars"
                  colon={false}
                  rules={[{ validator: this.validatorNumber }]}
                >
                  <Input />
                </Form.Item>
                <Button className="submit-btn" htmlType="submit">Archived recommendation</Button>
              </Form>
            </div>
            <div className="archive-wrapper-table">
              <div className="archive-table-header">
                <div>Repo Name</div>
                <div>Confidence</div>
              </div>
              <div className="archive-table-body">
                <div className="archive-table-line">
                  <div>Repo Name</div>
                  <div>Confidence</div>
                </div>
                <div className="archive-table-line">
                  <div>Repo Name</div>
                  <div>Confidence</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
