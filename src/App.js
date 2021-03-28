/*
 * @Descripttion: 描述
 * @Author: ljz
 * @Date: 2021-02-04 10:00:43
 * @LastEditors: ljz
 * @LastEditTime: 2021-03-28 14:45:59
 */
import './App.css';
import { Button, Input, Table, Form, Row, Col } from 'antd';
import React from 'react';
import axios from 'axios';
import moment from 'moment'
import * as echarts from 'echarts'

import githubIcon from './assets/imgs/gitHub.png'
import repositoryIcon from './assets/imgs/repository.png'
import clockIcon from './assets/imgs/clock.png'
import emailIcon from './assets/imgs/email.png'
import emptyIcon from './assets/imgs/empty.png'
import APIS from './api/api';
import { validatorNumber, softmax } from './utils'
import commitsData from './assets/commits-data'

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
      let aTime = new Date(a.updated_at).getTime();
      let bTime = new Date(b.updated_at).getTime();
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
    key: 'open_issues',
    dataIndex: 'open_issues',
    sorter: (a, b) => a.open_issues - b.open_issues
  },
  {
    title: 'forks',
    key: 'forks',
    dataIndex: 'forks',
    sorter: (a, b) => a.forks_count - b.forks_count
  },
  {
    title: 'commits',
    key: 'commits',
    dataIndex: 'commits',
    sorter: (a, b) => a.commits - b.commits
  },
  {
    title: 'Archived Status',
    key: 'archived',
    dataIndex: 'archived',
    sorter: (a, b) => a.archived - b.archived,
    render: (value) => {
      return value.archived ? 'YES' : 'NO'
    }
  },
]

class App extends React.Component {

  // 初始化数据
  state = {
    list: [], // repositories 数据列表
    memberList: [],
    userInfo: {}, // 用户信息
    currentPage: 1,
    archivedList: []
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
        this.formatLanguagePerData(repositoriesData)
        // 排序并取出前10 的commit数据
        let commitTop10Arr = repositoriesData.sort((a, b) => b.commits - a.commits).slice(0, 10)
        this.setState({
          userInfo,
          memberList,
          list: repositoriesData
        })
        this.formatCommitPerData(commitTop10Arr)
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
        // 处理commits数据
        list.forEach(item => {
          if (commitsData[item.name] !== undefined) {
            item.commits = commitsData[item.name]
          }
        })

        // 排序并取出前10 的commit数据
        let commitTop10Arr = list.sort((a, b) => b.commits - a.commits).slice(0, 10)
        // 缓存repositoriesData数据
        localStorage.setItem('repositoriesData', JSON.stringify(list));
        this.formatLanguagePerData(list)
        this.formatCommitPerData(commitTop10Arr)
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

  /**
   * 格式化echarts  language需要的数据
   * @param {*} data 
   */
  formatLanguagePerData(data) {
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
      // backgroundColor: '#E1D9CA',
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

  /**
 * 格式化echarts  commits top10需要的数据
 * @param {*} data 
 */
  formatCommitPerData(data) {
    let seriesData = [];
    data.forEach(item => {
      seriesData.push({
        name: item.name,
        value: item.commits
      })
    })

    const reposCommitTop10 = document.getElementById('repos-commit-top10');
    // 初始化echarts对象
    const reposCommitInit = echarts.init(reposCommitTop10);
    let reposCommitsOptions = {
      title: {
        text: 'Commits per Repos(top 10)',
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
          name: 'Commits count',
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
    reposCommitInit.setOption(reposCommitsOptions)
  }

  // 点击头像 跳转页面
  handleToavatarGit(url) {
    window.open(url)
  }

  /**
   * 提交数据
   * @param {} value 
   */
  handleSubmit({ time, Issues, Forks }) {
    let { list } = this.state;
    let archivedList = softmax(time, Issues, Forks, list);
    this.setState({ archivedList })
  }


  render() {
    let { userInfo, memberList, list, archivedList } = this.state
    return (
      <div className="App">
        <Row className="title-header">
          {/* 添加栅格系统 */}
          {/* 文档 https://ant.design/components/grid-cn/ */}
          {/* xs:屏幕 < 576px 响应式栅格，可为栅格数或一个包含其他属性的对象 */}
          {/* sm:屏幕 ≥ 576px 响应式栅格，可为栅格数或一个包含其他属性的对象 */}
          {/* md:屏幕 >= 768px 响应式栅格，可为栅格数或一个包含其他属性的对象 */}
          {/* lg:屏幕 ≥ 992px 响应式栅格，可为栅格数或一个包含其他属性的对象 */}
          {/* xl:屏幕 ≥ 1200px 响应式栅格，可为栅格数或一个包含其他属性的对象 */}
          <Col xs={24} sm={24} md={6} lg={3} xl={3}>
            <img src={userInfo.avatar_url} alt="头像" /></Col>
          <Col xs={24} sm={24} md={18} lg={18} xl={18}>
            <div className="title">{userInfo.name}</div></Col>
        </Row>
        <div className="main">
          <Row className="statistics-container">
            <Col xs={24} sm={24} md={10} lg={4} xl={4}>
              <div className="statistics-info">
                <div>
                  <h3 className="user-name">{userInfo.login}</h3>
                  <div><img src={githubIcon} alt="github" />{userInfo.public_repos} contributions on github</div>
                  <div><img src={repositoryIcon} alt="repositoryIcon" />{userInfo.public_repos} public repos</div>
                  <div><img src={clockIcon} alt="clockIcon" />Joined Github  {new Date().getFullYear() - new Date(userInfo.created_at).getFullYear()} years ago</div>
                  <div><img className="email-icon" src={emailIcon} alt="emailIcon" />{userInfo.email || 'null'}</div>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={24} md={14} lg={7} xl={7}>
              <div id="repos-commit-top10"></div>
            </Col>
            <Col xs={24} sm={24} md={14} lg={7} xl={7}>
              <div id="repos-echarts"></div>
            </Col>
            <Col xs={24} sm={24} md={10} lg={5} xl={5} push={1}>
              <div className="member-container">
                <p className="member-title">
                  <span>People</span>
                </p>
                <div className="member-list">{memberList.map(item => (
                  <img className="avatar" key={item.id} src={item.avatar_url} alt="avatar_url" onClick={() => this.handleToavatarGit(item.html_url)} />
                ))}</div>
              </div>
            </Col>
          </Row>
          <Row className="table-container">
            <Col xs={24} sm={24} md={16} lg={16} xl={16}>
              <h3>Repos Information</h3>
              <Table className="table" size="small" rowKey="id" columns={columns} dataSource={list} />
            </Col>
            <Col className="archive-wrapper" xs={24} sm={24} md={7} lg={7} xl={7} offset={1}>
              <div className="archive-wrapper-header">
                <h3>Archived recommendation</h3>
                <Row gutter={[8, 16]}>
                  <Form className="weigth-form"
                    onFinish={(value) => this.handleSubmit(value)}>
                    <Col span={6} xs={12} sm={12} md={12} lg={12} xl={6}>
                      <Form.Item
                        label="time Intervel"
                        name="time"
                        colon={false}
                        rules={[{ validator: validatorNumber }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={6} xs={12} sm={12} md={12} lg={12} xl={6}>
                      <Form.Item
                        label="Issues"
                        name="Issues"
                        colon={false}
                        rules={[{ validator: validatorNumber }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={6} xs={12} sm={12} md={12} lg={12} xl={6}>
                      <Form.Item
                        label="Forks"
                        name="Forks"
                        colon={false}
                        rules={[{ validator: validatorNumber }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={5} xs={12} sm={12} md={12} lg={12} xl={5}>
                      <Button className="submit-btn" htmlType="submit">GO</Button>
                    </Col>
                  </Form>
                </Row>
              </div>
              <div className="archive-wrapper-table">
                <div className="archive-table-header">
                  <div>Repo Name</div>
                  <div>Confidence</div>
                </div>
                {archivedList.length > 0 ?
                  <div className="archive-table-body">
                    {archivedList.map(item => (
                      <div key={item.repoName} className="archive-table-line">
                        <div>{item.repoName}</div>
                        <div>{(parseFloat(item.value) * 100).toFixed(2)}%</div>
                      </div>
                    ))}
                  </div> :
                  <img className="empty-icon" src={emptyIcon} alt="empty" />
                }
              </div>
            </Col>
          </Row>
        </div >
      </div >
    );
  }
}

export default App;
