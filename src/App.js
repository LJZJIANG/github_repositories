/*
 * @Descripttion: 描述
 * @Author: ljz
 * @Date: 2021-02-04 10:00:43
 * @LastEditors: ljz
 * @LastEditTime: 2021-03-21 23:38:25
 */
import logo from './logo.svg';
import './App.css';
import { Table } from 'antd';
import React from 'react';
import axios from 'axios';
import moment from 'moment'
import * as echarts from 'echarts'

import rdata from './data'

const BASE_URL = 'https://api.github.com/users/brown-ccv';


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
    userInfo: {}, // 用户信息
    currentPage: 1
  }

  // react生命周期  在里面请求数据
  componentDidMount() {
    this.getRepositoriesData(this.state.currentPage)
    // 获取用户信息
    this.getUserInfo()
    const reposEchartsDom = document.getElementById('repos-echarts');
    // 初始化echarts对象
    const reposEchartsInit = echarts.init(reposEchartsDom);
    // echarts配置项
    const reposEchartsOptions = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        top: '5%',
        left: 'center'
      },
      series: [
        {
          name: '访问来源',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '40',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: 1048, name: '搜索引擎' },
            { value: 735, name: '直接访问' },
            { value: 580, name: '邮件营销' },
            { value: 484, name: '联盟广告' },
            { value: 300, name: '视频广告' }
          ]
        }
      ]
    };
    reposEchartsInit.setOption(reposEchartsOptions)
  }

  async getUserInfo() {
    let result = await axios.get(BASE_URL);
    this.setState({
      userInfo: result.data
    })
  }

  async getRepositoriesData() {
    let { list, currentPage } = this.state;
    // 通过axios请求数据
    // 请求参数来源GitHub api文档  https://docs.github.com/en/rest/reference/repos#list-repositories-for-a-user
    let result = await axios.get(BASE_URL + '/repos', {
      params: {
        per_page: 100, //一次请求多少数据,
        page: currentPage,// 当前请求页数
      }
    })
    let repositoriesData = result.data;
    // let repositoriesData = rdata;
    // 合并数据
    list = [...list, ...repositoriesData];
    // 将数据更新到缓存中
    this.setState({ list, currentPage: currentPage + 1 }, () => {
      // 如果返回条数有100 ，代表可能还有更多数据，继续请求下一页数据  直到返回条数小于100时，结束请求
      if (repositoriesData.length >= 100) {
        this.getRepositoriesData()
      }
    })


  }


  render() {
    let { userInfo, list } = this.state
    return (
      <div className="App">
        <div className="title-header">
          <img src={userInfo.avatar_url} alt="头像" />
          <div className="title">Center for Computation and Visualization,Brown University</div>
        </div>
        <div className="statistics-container">
          <div className="statistics-info">
            <div>
              <h3>{userInfo.login}</h3>
              <div><img src="" alt="" />{userInfo.public_repos} contributions on github</div>
              <div><img src="" alt="" />{userInfo.public_repos} public repos</div>
              <div><img src="" alt="" />Joined Github  {new Date().getFullYear() - new Date(userInfo.created_at).getFullYear()} years ago</div>
              <div><img src="" alt="" />{userInfo.email}</div>
            </div>
            <div id="contributions-echarts"></div>
          </div>
          <div id="repos-echarts"></div>
        </div>
        <Table rowKey="id" columns={columns} dataSource={list} />
      </div>
    );
  }
}

export default App;
